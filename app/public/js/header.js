fetch("/header.html")
    .then(response => {
        if (!response.ok) throw new Error("Failed to load header");
        return response.text();
    })
    .then(htmlString => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(htmlString, "text/html");
        let header = doc.querySelector("header");
        if (!header) throw new Error('No <header> element found in header.html');
        document.body.insertBefore(header, document.body.firstChild);
    })
    .catch(err => {
        console.error("Error loading header: ", err);
    })