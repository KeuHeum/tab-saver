//". . . . . . . . Save and open Chrome tabs . . . . . . . . .     . . . . . . 현재 열려있는 탭들을 저장 및 열기 . . . . . . ."

const download = res => {
    let today = new Date();

    chrome.downloads.download({
        url: URL.createObjectURL(
            new Blob([res], {
                type: 'application/json',
            }),
        ),
        filename: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} tabs.json`,
    })
}

const getAllTabsId = async () =>
    JSON.stringify(
        (
            await Promise.allSettled(
                (
                    await chrome.windows.getAll()
                )
                    .map(w => w.id)
                    .filter(_ => _)
                    .map(windowId => chrome.tabs.query({ windowId: windowId })),
            )
        )
            .filter(o => o.status === 'fulfilled')
            .map(ful => ful.value)
            .map(windowTabs => windowTabs.map(tab => tab.url)),
        null,
        2,
    )

document.addEventListener('DOMContentLoaded', async domEv => {
    const extractBtn = document.getElementById('extract')
    const importBtn = document.getElementById('import-btn')
    const importFile = document.getElementById('import-file')
    const tabs_count = document.getElementById('tabs-count')
    const out = document.getElementById('out')
    
    extractBtn.addEventListener('click', async ev => {
        const res = await getAllTabsId()
        out.innerText = res

        let window_num = tab_num = 0
        for (const i of JSON.parse(res)){window_num++; tab_num += parseInt(i.length);}
        tabs_count.innerText = `Window: ${window_num}, Tab: ${tab_num}`     

        download(res)
    })

    importBtn.addEventListener('click', async ev => {
        importFile.click()
    })

    importFile.addEventListener('change', ev => {
        const [file] = ev.target.files

        const fr = new FileReader()

        fr.onload = () => {
            try {
                out.innerText = fr.result

                let window_num = tab_num = 0
                
                for (const i of JSON.parse(fr.result)){window_num++; tab_num += parseInt(i.length);}
                tabs_count.innerText = `Window: ${window_num}, Tab: ${tab_num}`
                
                Promise.allSettled(
                    JSON.parse(fr.result).map(w =>
                        {
                            chrome.windows.create({
                                url: w,
                            })
                        },
    
                    ),
                )
            } catch (e) {
                if (e instanceof TypeError) {
                    tabs_count.innerText = "Invalid Json Data"
                }
            }

        }

        fr.onerror = err => {
            console.error(err)
        }

        fr.readAsText(file)
    })
})
