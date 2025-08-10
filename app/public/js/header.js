const header = document.getElementById("site-header");

fetch("/header.html")
    .then(response => {
        if (!response.ok) throw new Error("Failed to load header");
        return response.text();
    })
    .then(htmlString => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(htmlString, "text/html");
        let loadedHeader = doc.querySelector("header");
        if (!loadedHeader) throw new Error('No <header> element found in header.html');

        while (loadedHeader.firstChild) {
            header.appendChild(loadedHeader.firstChild);
        }

        header.classList.remove("loading");
        header.classList.add("loaded");
    })
    .catch(err => {
        console.error("Error loading header: ", err);
    })