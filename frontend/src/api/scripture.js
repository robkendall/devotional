// Scripture API Bible - ESV translation
// API documentation: https://scripture.api.bible/livedocs

const BIBLE_ID = "de4e12af7f28f599-02"; // ESV translation ID

export async function searchBooks(query) {
    try {
        const response = await fetch(
            `https://api.scripture.api.bible/v1/bibles/${BIBLE_ID}/search?query=${encodeURIComponent(query)}&limit=10`,
            {
                headers: {
                    "api-key": import.meta.env.VITE_SCRIPTURE_API_KEY,
                },
            }
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        return data.results || [];
    } catch (err) {
        console.error("Error searching scriptures:", err);
        return [];
    }
}

export async function getScripture(verseId) {
    try {
        const response = await fetch(
            `https://api.scripture.api.bible/v1/verses/${verseId}?include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
            {
                headers: {
                    "api-key": import.meta.env.VITE_SCRIPTURE_API_KEY,
                },
            }
        );
        if (!response.ok) throw new Error("Failed to fetch scripture");
        const data = await response.json();
        return data.data;
    } catch (err) {
        console.error("Error fetching scripture:", err);
        return null;
    }
}

export async function getVerseRange(bookId, startChapter, startVerse, endChapter, endVerse) {
    try {
        const verseStart = `${bookId}.${startChapter}.${startVerse}`;
        const verseEnd = `${bookId}.${endChapter}.${endVerse}`;

        const response = await fetch(
            `https://api.scripture.api.bible/v1/verses?q=${verseStart}-${verseEnd}&bibleId=${BIBLE_ID}&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true`,
            {
                headers: {
                    "api-key": import.meta.env.VITE_SCRIPTURE_API_KEY,
                },
            }
        );
        if (!response.ok) throw new Error("Failed to fetch verse range");
        const data = await response.json();
        return data.data;
    } catch (err) {
        console.error("Error fetching verse range:", err);
        return null;
    }
}
