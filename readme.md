# AI assistent for combating missinformation
A program that runs as a google/firefox extention and scans pages for any fictive/missleading information. The information is filtered through and AI to make mure it's true or false and it proves why it's false/true.

Pros:
    > Yes.

Cons:
    > High resource usage.

Web Extension

## DomNode
Depricated. Was used to represent a Data Node within a DOM Tree Organised using the DomParser. Proven too complicated for my level lol
## DomParser
Depricated. Was the DOM parser itself, instead of reading document.innertext it reads the entire file including the <type>. Required a remake of the back and front end which proved itself dificult
## background.js
it's the main script that runs in the background of the user scrolling through pages. It provides all the functions and connections between the other modules
## fact_checker.js
The main communication module between the ai server and the extention itself. It sends the API calls and recieves the answear which it routes to the frontend to be displayed
## scraper.js
Scrapes all the text from the page selected by the background.js. scrapper.js is ran by the main js file and doesn't run by itself. It only provides functions.