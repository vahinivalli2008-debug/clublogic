# ClubLogic – Corrected local project

This project is a small browser-based version of your supplied `eligibility.pl` rules.

## Run the website
1. Extract `ClubLogic_Corrected.zip`.
2. Open the `ClubLogic_Corrected` folder in Visual Studio Code.
3. Open `index.html` in a browser, or use the VS Code Live Server extension.
4. Use the Eligibility section to enter CGPA (out of 10), attendance percentage, club and interest.

No installation or backend is required. Internet is only needed for the optional Google Fonts import; the application logic runs locally in your browser.

## Exact rules used
- Coding: CGPA >= 6.0, attendance >= 75, interest = programming
- Robotics: CGPA >= 6.0, attendance >= 75, interest = electronics
- Literary: CGPA >= 5.5, attendance >= 70, interest = writing
- Eco: CGPA >= 5.0, attendance >= 70, interest = environment

All three conditions must pass. The result is `eligible` only if no failed conditions are collected.

## Important
The website mirrors the Prolog rules in JavaScript so it can run as a static website. It does not launch a SWI-Prolog runtime in the browser. The original Prolog file is included as `eligibility.pl`. To run that file with real Prolog, install SWI-Prolog and load it in the SWI-Prolog console.

## Project files
- `index.html` – page structure
- `css/style.css` – styling and responsive layout
- `js/app.js` – eligibility logic, simulator, test cases and query demo
- `eligibility.pl` – original Prolog knowledge base and rules
