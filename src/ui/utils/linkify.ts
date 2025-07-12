export function linkify(text: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    if (!text) {
        return fragment;
    }

    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        const textBeforeLink = text.slice(lastIndex, match.index);
        if (textBeforeLink) {
            fragment.appendChild(document.createTextNode(textBeforeLink));
        }

        const url = match[0];
        const a = document.createElement('a');
        let fullUrl = url;
        if (!/^(https?|ftp|file):\/\//i.test(url)) {
            fullUrl = 'https://' + url;
        }
        a.href = fullUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = url;
        fragment.appendChild(a);
        lastIndex = urlRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        const textAfterLastLink = text.slice(lastIndex);
        fragment.appendChild(document.createTextNode(textAfterLastLink));
    }

    return fragment;
}