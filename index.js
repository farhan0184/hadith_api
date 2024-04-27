require('dotenv').config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();


const app = express();
const cors = require('cors');
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));
const port = process.env.PORT || 5000;


const db = new sqlite3.Database('hadith_db.db', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the database.');
    }
});
app.get('/', (req, res) => {
    res.send("hello world")
})

// app.get('/books',(req,res)=>{
//     const sql = `
//         SELECT id, title FROM books INNER JOIN chapter ON books.book_name = chapter.book_name 
//     `;
//     db.all(sql, [], (err, rows) => {
//         if (err) {
//             console.error('Error executing query:', err.message);
//             res.status(500).json({ error: 'Failed to retrieve data from the database' });
//             return;
//         }

//         // Send the books as JSON response
//         res.json(rows);
//     });

// })

app.get('/books', (req, res) => {
    // Query to fetch books with chapters
    const query = `
    SELECT books.id AS book_id, books.title AS book_title, books.title_ar AS book_title_ar, books.number_of_hadis AS total_hadiths , books.abvr_code AS abvr_code,books.book_descr AS book_descr,
    chapter.id AS chapter_id, chapter.title AS chapter_title, chapter.hadis_range AS hadith_range,
    section.id AS section_id, section.title AS section_title , section.number AS section_number, section.preface AS preface,
    hadith.hadith_id AS hadith_id, hadith.narrator AS narrator,
    hadith.ar AS hadith_ar, hadith.bn AS hadith_br, hadith.grade AS hadith_grade
FROM books
JOIN chapter ON books.book_name = chapter.book_name
JOIN section ON chapter.id = section.chapter_id
JOIN hadith ON section.id = hadith.section_id
ORDER BY books.id, chapter.id, section.id, hadith.hadith_id;
    `;

    // Execute the query
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        // Organize fetched data into the desired JSON structure
        const books = [];
        let currentBook = null;
        let currentChapter = null;
        let currentSection = null;


        rows.forEach(row => {
            if (!currentBook || currentBook.id !== row.book_id) {
                currentBook = {
                    id: row.book_id,
                    title: row.book_title,
                    total_hadiths: row.total_hadiths,
                    abvr_code: row.abvr_code,
                    book_descr: row.book_descr,
                    book_title_ar: row.book_title_ar,
                    chapters: []
                };
                books.push(currentBook);
                currentChapter = null;
            }

            if (!currentChapter || currentChapter.id !== row.chapter_id) {
                currentChapter = {
                    id: row.chapter_id,
                    title: row.chapter_title,
                    hadith_range: row.hadith_range,
                    sections: []
                };
                currentBook.chapters.push(currentChapter);
                currentSection = null;
            }

            if(!currentSection || currentSection.id !== row.section_id){
                currentSection = {
                    id: row.section_id,
                    title: row.section_title,
                    preface: row.preface,
                    section_number: row.section_number,
                    hadiths: []
                };
                currentChapter.sections.push(currentSection);
            }

            currentSection.hadiths.push({
                id: row.hadith_id,
                narrator: row.narrator,
                ar: row.hadith_ar,
                bn: row.hadith_br,
                grade: row.hadith_grade
            })

            


        });

        // Send the JSON response
        res.json(books);
    });
});

app.listen(port, (error) => {
    if (error) {
        console.log("the server did not start", error);
        return
    }

    console.log(`server is running on port ${port}`);
})