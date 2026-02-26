# Boards & Subjects Seed Document
## PapaCambridge-style Tree + Website Import Prompt

This document contains:
1) A **complete subject tree** organized by Board → Qualification/Program → Subjects
2) A **seed JSON** you can import into your DB (or use to generate website navigation)
3) A **copy/paste prompt** for your build agent to add this into the website + DB

Authentication is excluded.

---

## 1) Canonical Tree Shape (what your website must follow)

**board → qualification/program → (optional branch) → subject → resource_hub**

- **board** = CAIE | Pearson (Edexcel) | IB
- **qualification/program** = IGCSE, O Level, AS & A Level … (varies per board)
- **branch** = current/legacy (optional; mainly for Pearson)
- **subject** = name + optional code(s)

---

## 2) Subject Lists by Board

### 2.1 CAIE (Cambridge)

#### CAIE → IGCSE (subjects)
- Accounting (0452, 0985)
- Afrikaans (0512, 0548)
- Agriculture (0600)
- Arabic (0508, 0527, 0544, 7180-UK, 7184)
- Art and Design (0400, 0415, 0989)
- Bahasa Indonesia (0538)
- Bangladesh Studies (0449)
- Biology (0438, 0610, 0970)
- Business Studies (0450, 0986-UK)
- Chemistry (0439, 0620, 0971-UK)
- Child Development (0637)
- Chinese (0509, 0523, 0534, 0547)
- Computer Science (0478, 0984)
- Computer Studies (0420, 0441)
- Czech (First Language) (0514)
- Design and Technology (0445, 0979)
- Development Studies (0453)
- Drama (0411, 0428, 0994)
- Dutch (0503, 0515)
- Economics (0437, 0455, 0987)
- English (as a Second Language) (0465)
- English (multiple syllabi/codes: 0427, 0476, 0477, 0486, 0500, 0510, 0511, 0522, 0524, 0526, 0627, 0772, 0990, 0991, 0993)
- English (additional set: 0475, 0472, 0992)
- Enterprise (0454)
- Environmental Management (0680)
- Food and Nutrition (0648)
- French (0501, 0520, 0528, 0685-UK, 7156)
- Geography (0460, 0976)
- German (0505, 0525, 0529, 0677, 7159-UK)
- Global Perspectives (0426, 0457)
- Greek (0536, 0543)
- Hindi (0549)
- History (0416, 0470, 0977)
- History (American) (0409)
- ICT (0417, 0983)
- India Studies (0447)
- Indonesian (0545)
- IsiZulu (0531)
- Islamiyat (0493)
- Italian (0535, 7164)
- Japanese (0507, 0519)
- Kazakh (0532)
- Korean (0521)
- Latin (0480)
- Malay (0546)
- Malay (First Language) (0696)
- Marine Science (Maldives only) (0697)
- Mathematics (0444, 0459, 0580, 0581, 0606, 0607, 0626, 0980)
- Music (0410, 0429, 0978-UK)
- Pakistan Studies (0448)
- Physical Education (0413, 0995)
- Physical Science (0652)
- Physics (0443, 0625, 0972)
- Portuguese (0504, 0540)
- Religious Studies (0490)
- Russian (0516)
- Sanskrit (0499)
- Science (0653)
- Sciences (0442, 0654, 0973)
- Sociology (0495)
- Spanish (0474, 0502, 0530, 0533, 0537, 0678, 7160)
- Spanish Literature (0488)
- Swahili (0262)
- Thai (0518)
- Travel and Tourism (0471)
- Turkish (0513)
- Twenty-First Century Science (0608)
- Urdu (0539)

#### CAIE → O Level (subjects)
- Accounting (7707)
- Agriculture (5038)
- Arabic (3180)
- Art (6010)
- Art and Design (6090)
- Bangladesh Studies (7094)
- Bengali (3204)
- Biblical Studies (2035)
- Biology (5090)
- Business Studies (7115)
- CDT Design and Communication (7048)
- Chemistry (5070)
- Commerce (7100)
- Commercial Studies (7101)
- Computer Science (2210)
- Computer Studies (7010)
- Design and Communication (7048)
- Design and Technology (6043)
- Economics (2281)
- English Language (1123)
- Environmental Management (5014)
- Fashion and Fabrics (6050)
- Fashion and Textiles (6130)
- Food and Nutrition (6065)
- French (3015)
- Geography (2217)
- German (3025)
- Global Perspectives (2069)
- Hindi (3195)
- Hinduism (2055)
- History (2147)
- History (Modern World Affairs) (2134)
- History World Affairs, 1917–1991 (2158)
- Human and Social Biology (5096)
- Islamic Religion and Culture (2056)
- Islamic Studies (2068)
- Islamiyat (2058)
- Literature in English (2010)
- Marine Science (5180)
- Mathematics Additional (4037)
- Mathematics D (4024)
- Nepali (3202)
- Pakistan Studies (2059)
- Physics (5054)
- Principles of Accounts (7110)
- Religious Studies (2048)
- Science Combined (5129)
- Setswana (3158)
- Sinhala (3205)
- Sociology (2251)
- Spanish (3035)
- Statistics (4040)
- Swahili (3162)
- Tamil (3206, 3226)
- Travel and Tourism (7096)
- Urdu (3247, 3248)

#### CAIE → AS & A Level (subjects)
- Accounting (9706)
- Afrikaans (8679, 8779, 9679)
- Applied ICT (9713)
- Arabic (8680, 9680)
- Art and Design (9704, 9479)
- Biblical Studies (9484)
- Biology (9184, 9700)
- Business Studies (9707)
- Business (9609)
- Cambridge International Project Qualification (9980)
- Chemistry (9185, 9701)
- Chinese (8238, 8669, 8681, 9715, 9868)
- Classical Studies (9274)
- Computer Science (9608, 9618)
- Computing (9691)
- Design and Technology (9481, 9705)
- Design and Textiles (9631)
- Divinity (9011, 8041)
- Drama (9482)
- Economics (9708)
- English (8274, 8287, 8693, 8695, 9093)
- English Literature (9276, 9695)
- English General Paper (8021)
- Environmental Management (8291)
- Food Studies (9336)
- French (8277, 8682, 9281, 9716)
- French Literature (8670)
- French Language & Literature (9898)
- General Paper (8001, 8004)
- Geography (9278, 9696)
- German (8027, 8683, 9717)
- Global Perspectives (8275, 8987)
- Global Perspectives & Research (9239)
- Hindi (8687, 9687)
- Hindi Literature (8675)
- Hinduism (9014, 9487, 8058)
- History (9279, 9389, 9489, 9697)
- Information Technology (9626)
- Islamic Studies (9013, 8053, 9488)
- Japanese (8281)
- Law (9084)
- Marathi (8688, 9688)
- Marine Science (9693)
- Mathematics (9231, 9280, 9709)
- Media Studies (9607)
- Music (9385, 9483, 9703, 8663)
- Nepal Studies (8024)
- Physical Education (9396)
- Physical Science (8780)
- Physics (9702)
- Portuguese (8672, 8684, 9718)
- Psychology (9698, 9990)
- Sociology (9699)
- Spanish (8022, 8278, 8279, 8673, 8685, 9282, 9719, 8665, 9844)
- Sport & Physical Education (8386)
- Tamil (8689, 9689)
- Telugu (8690, 9690)
- Thinking Skills (9694)
- Travel and Tourism (9395)
- Urdu (8686, 9676, 9686)

---

### 2.2 Pearson (Edexcel)

#### Pearson → International GCSE → Current Qualifications (subjects)
- Accounting
- Arabic
- Art and Design
- Bangla
- Bangladesh Studies
- Bengali
- Biology
- Business
- Chemistry
- Chinese
- Classical Arabic
- Commerce
- Computer Science
- Economics
- English as a Second Language
- English Language A
- English Language B
- English Literature
- French
- Further Pure Mathematics
- Geography
- German
- Global Citizenship
- Greek (first language)
- Gujarati
- Hindi
- History
- Human Biology
- Information and Communication Technology
- Islamic Studies
- Islamiyat
- Mathematics A
- Mathematics B
- Modern Greek
- Pakistan Studies
- Physics
- Religious Studies
- Science (Double Award)
- Science (Single Award)
- Sinhala
- Spanish
- Swahili
- Tamil
- Turkish
- Urdu

Note: Pearson International Advanced Level and Pearson GCSE subject lists can be added later in the same format (qualification → subjects). If you want, create empty placeholders now.

---

### 2.3 IB (International Baccalaureate)

#### IB → MYP (subject groups)
- Language acquisition
- Language and literature
- Individuals and societies
- Sciences
- Mathematics
- Arts
- Physical and health education
- Design

#### IB → DP (subject groups)
- Studies in language and literature
- Language acquisition
- Individuals and societies
- Sciences
- Mathematics
- The arts

Optional (recommended) IB Core as resource-only “subjects”:
- TOK (Theory of Knowledge)
- EE (Extended Essay)
- CAS (Creativity, Activity, Service)

---

## 3) Seed JSON (Import into DB + Generate Website Nav)

### 3.1 Slug Rules
- board_key: lowercase
- qualification_key: lowercase
- subject_slug: kebab-case of `{subject_name}` plus the first code if present
  - example: `mathematics-9709` or `computer-science-0478`

### 3.2 Seed JSON

```json
{
  "boards": [
    {
      "board_key": "caie",
      "display_name": "CAIE - Cambridge Assessment International Education",
      "qualifications": [
        {
          "qual_key": "igcse",
          "display_name": "IGCSE",
          "subjects": [
            {"subject_name": "Accounting", "codes": ["0452","0985"]},
            {"subject_name": "Afrikaans", "codes": ["0512","0548"]},
            {"subject_name": "Agriculture", "codes": ["0600"]},
            {"subject_name": "Arabic", "codes": ["0508","0527","0544","7180-UK","7184"]},
            {"subject_name": "Art and Design", "codes": ["0400","0415","0989"]},
            {"subject_name": "Bahasa Indonesia", "codes": ["0538"]},
            {"subject_name": "Bangladesh Studies", "codes": ["0449"]},
            {"subject_name": "Biology", "codes": ["0438","0610","0970"]},
            {"subject_name": "Business Studies", "codes": ["0450","0986-UK"]},
            {"subject_name": "Chemistry", "codes": ["0439","0620","0971-UK"]},
            {"subject_name": "Child Development", "codes": ["0637"]},
            {"subject_name": "Chinese", "codes": ["0509","0523","0534","0547"]},
            {"subject_name": "Computer Science", "codes": ["0478","0984"]},
            {"subject_name": "Computer Studies", "codes": ["0420","0441"]},
            {"subject_name": "Czech (First Language)", "codes": ["0514"]},
            {"subject_name": "Design and Technology", "codes": ["0445","0979"]},
            {"subject_name": "Development Studies", "codes": ["0453"]},
            {"subject_name": "Drama", "codes": ["0411","0428","0994"]},
            {"subject_name": "Dutch", "codes": ["0503","0515"]},
            {"subject_name": "Economics", "codes": ["0437","0455","0987"]},
            {"subject_name": "English (as a Second Language)", "codes": ["0465"]},
            {"subject_name": "English", "codes": ["0427","0476","0477","0486","0500","0510","0511","0522","0524","0526","0627","0772","0990","0991","0993","0475","0472","0992"]},
            {"subject_name": "Enterprise", "codes": ["0454"]},
            {"subject_name": "Environmental Management", "codes": ["0680"]},
            {"subject_name": "Food and Nutrition", "codes": ["0648"]},
            {"subject_name": "French", "codes": ["0501","0520","0528","0685-UK","7156"]},
            {"subject_name": "Geography", "codes": ["0460","0976"]},
            {"subject_name": "German", "codes": ["0505","0525","0529","0677","7159-UK"]},
            {"subject_name": "Global Perspectives", "codes": ["0426","0457"]},
            {"subject_name": "Greek", "codes": ["0536","0543"]},
            {"subject_name": "Hindi", "codes": ["0549"]},
            {"subject_name": "History", "codes": ["0416","0470","0977"]},
            {"subject_name": "History (American)", "codes": ["0409"]},
            {"subject_name": "ICT", "codes": ["0417","0983"]},
            {"subject_name": "India Studies", "codes": ["0447"]},
            {"subject_name": "Indonesian", "codes": ["0545"]},
            {"subject_name": "IsiZulu", "codes": ["0531"]},
            {"subject_name": "Islamiyat", "codes": ["0493"]},
            {"subject_name": "Italian", "codes": ["0535","7164"]},
            {"subject_name": "Japanese", "codes": ["0507","0519"]},
            {"subject_name": "Kazakh", "codes": ["0532"]},
            {"subject_name": "Korean", "codes": ["0521"]},
            {"subject_name": "Latin", "codes": ["0480"]},
            {"subject_name": "Malay", "codes": ["0546"]},
            {"subject_name": "Malay (First Language)", "codes": ["0696"]},
            {"subject_name": "Marine Science (Maldives only)", "codes": ["0697"]},
            {"subject_name": "Mathematics", "codes": ["0444","0459","0580","0581","0606","0607","0626","0980"]},
            {"subject_name": "Music", "codes": ["0410","0429","0978-UK"]},
            {"subject_name": "Pakistan Studies", "codes": ["0448"]},
            {"subject_name": "Physical Education", "codes": ["0413","0995"]},
            {"subject_name": "Physical Science", "codes": ["0652"]},
            {"subject_name": "Physics", "codes": ["0443","0625","0972"]},
            {"subject_name": "Portuguese", "codes": ["0504","0540"]},
            {"subject_name": "Religious Studies", "codes": ["0490"]},
            {"subject_name": "Russian", "codes": ["0516"]},
            {"subject_name": "Sanskrit", "codes": ["0499"]},
            {"subject_name": "Science", "codes": ["0653"]},
            {"subject_name": "Sciences", "codes": ["0442","0654","0973"]},
            {"subject_name": "Sociology", "codes": ["0495"]},
            {"subject_name": "Spanish", "codes": ["0474","0502","0530","0533","0537","0678","7160"]},
            {"subject_name": "Spanish Literature", "codes": ["0488"]},
            {"subject_name": "Swahili", "codes": ["0262"]},
            {"subject_name": "Thai", "codes": ["0518"]},
            {"subject_name": "Travel and Tourism", "codes": ["0471"]},
            {"subject_name": "Turkish", "codes": ["0513"]},
            {"subject_name": "Twenty-First Century Science", "codes": ["0608"]},
            {"subject_name": "Urdu", "codes": ["0539"]}
          ]
        },
        {
          "qual_key": "o_level",
          "display_name": "O Level",
          "subjects": [
            {"subject_name": "Accounting", "codes": ["7707"]},
            {"subject_name": "Agriculture", "codes": ["5038"]},
            {"subject_name": "Arabic", "codes": ["3180"]},
            {"subject_name": "Art", "codes": ["6010"]},
            {"subject_name": "Art and Design", "codes": ["6090"]},
            {"subject_name": "Bangladesh Studies", "codes": ["7094"]},
            {"subject_name": "Bengali", "codes": ["3204"]},
            {"subject_name": "Biblical Studies", "codes": ["2035"]},
            {"subject_name": "Biology", "codes": ["5090"]},
            {"subject_name": "Business Studies", "codes": ["7115"]},
            {"subject_name": "CDT Design and Communication", "codes": ["7048"]},
            {"subject_name": "Chemistry", "codes": ["5070"]},
            {"subject_name": "Commerce", "codes": ["7100"]},
            {"subject_name": "Commercial Studies", "codes": ["7101"]},
            {"subject_name": "Computer Science", "codes": ["2210"]},
            {"subject_name": "Computer Studies", "codes": ["7010"]},
            {"subject_name": "Design and Communication", "codes": ["7048"]},
            {"subject_name": "Design and Technology", "codes": ["6043"]},
            {"subject_name": "Economics", "codes": ["2281"]},
            {"subject_name": "English Language", "codes": ["1123"]},
            {"subject_name": "Environmental Management", "codes": ["5014"]},
            {"subject_name": "Fashion and Fabrics", "codes": ["6050"]},
            {"subject_name": "Fashion and Textiles", "codes": ["6130"]},
            {"subject_name": "Food and Nutrition", "codes": ["6065"]},
            {"subject_name": "French", "codes": ["3015"]},
            {"subject_name": "Geography", "codes": ["2217"]},
            {"subject_name": "German", "codes": ["3025"]},
            {"subject_name": "Global Perspectives", "codes": ["2069"]},
            {"subject_name": "Hindi", "codes": ["3195"]},
            {"subject_name": "Hinduism", "codes": ["2055"]},
            {"subject_name": "History", "codes": ["2147"]},
            {"subject_name": "History (Modern World Affairs)", "codes": ["2134"]},
            {"subject_name": "History World Affairs, 1917–1991", "codes": ["2158"]},
            {"subject_name": "Human and Social Biology", "codes": ["5096"]},
            {"subject_name": "Islamic Religion and Culture", "codes": ["2056"]},
            {"subject_name": "Islamic Studies", "codes": ["2068"]},
            {"subject_name": "Islamiyat", "codes": ["2058"]},
            {"subject_name": "Literature in English", "codes": ["2010"]},
            {"subject_name": "Marine Science", "codes": ["5180"]},
            {"subject_name": "Mathematics Additional", "codes": ["4037"]},
            {"subject_name": "Mathematics D", "codes": ["4024"]},
            {"subject_name": "Nepali", "codes": ["3202"]},
            {"subject_name": "Pakistan Studies", "codes": ["2059"]},
            {"subject_name": "Physics", "codes": ["5054"]},
            {"subject_name": "Principles of Accounts", "codes": ["7110"]},
            {"subject_name": "Religious Studies", "codes": ["2048"]},
            {"subject_name": "Science Combined", "codes": ["5129"]},
            {"subject_name": "Setswana", "codes": ["3158"]},
            {"subject_name": "Sinhala", "codes": ["3205"]},
            {"subject_name": "Sociology", "codes": ["2251"]},
            {"subject_name": "Spanish", "codes": ["3035"]},
            {"subject_name": "Statistics", "codes": ["4040"]},
            {"subject_name": "Swahili", "codes": ["3162"]},
            {"subject_name": "Tamil", "codes": ["3206","3226"]},
            {"subject_name": "Travel and Tourism", "codes": ["7096"]},
            {"subject_name": "Urdu", "codes": ["3247","3248"]}
          ]
        },
        {
          "qual_key": "as_a_level",
          "display_name": "AS & A Level",
          "subjects": [
            {"subject_name": "Accounting", "codes": ["9706"]},
            {"subject_name": "Afrikaans", "codes": ["8679","8779","9679"]},
            {"subject_name": "Applied ICT", "codes": ["9713"]},
            {"subject_name": "Arabic", "codes": ["8680","9680"]},
            {"subject_name": "Art and Design", "codes": ["9704","9479"]},
            {"subject_name": "Biblical Studies", "codes": ["9484"]},
            {"subject_name": "Biology", "codes": ["9184","9700"]},
            {"subject_name": "Business Studies", "codes": ["9707"]},
            {"subject_name": "Business", "codes": ["9609"]},
            {"subject_name": "Cambridge International Project Qualification", "codes": ["9980"]},
            {"subject_name": "Chemistry", "codes": ["9185","9701"]},
            {"subject_name": "Chinese", "codes": ["8238","8669","8681","9715","9868"]},
            {"subject_name": "Classical Studies", "codes": ["9274"]},
            {"subject_name": "Computer Science", "codes": ["9608","9618"]},
            {"subject_name": "Computing", "codes": ["9691"]},
            {"subject_name": "Design and Technology", "codes": ["9481","9705"]},
            {"subject_name": "Design and Textiles", "codes": ["9631"]},
            {"subject_name": "Divinity", "codes": ["9011","8041"]},
            {"subject_name": "Drama", "codes": ["9482"]},
            {"subject_name": "Economics", "codes": ["9708"]},
            {"subject_name": "English", "codes": ["8274","8287","8693","8695","9093"]},
            {"subject_name": "English Literature", "codes": ["9276","9695"]},
            {"subject_name": "English General Paper", "codes": ["8021"]},
            {"subject_name": "Environmental Management", "codes": ["8291"]},
            {"subject_name": "Food Studies", "codes": ["9336"]},
            {"subject_name": "French", "codes": ["8277","8682","9281","9716"]},
            {"subject_name": "French Literature", "codes": ["8670"]},
            {"subject_name": "French Language & Literature", "codes": ["9898"]},
            {"subject_name": "General Paper", "codes": ["8001","8004"]},
            {"subject_name": "Geography", "codes": ["9278","9696"]},
            {"subject_name": "German", "codes": ["8027","8683","9717"]},
            {"subject_name": "Global Perspectives", "codes": ["8275","8987"]},
            {"subject_name": "Global Perspectives & Research", "codes": ["9239"]},
            {"subject_name": "Hindi", "codes": ["8687","9687"]},
            {"subject_name": "Hindi Literature", "codes": ["8675"]},
            {"subject_name": "Hinduism", "codes": ["9014","9487","8058"]},
            {"subject_name": "History", "codes": ["9279","9389","9489","9697"]},
            {"subject_name": "Information Technology", "codes": ["9626"]},
            {"subject_name": "Islamic Studies", "codes": ["9013","8053","9488"]},
            {"subject_name": "Japanese", "codes": ["8281"]},
            {"subject_name": "Law", "codes": ["9084"]},
            {"subject_name": "Marathi", "codes": ["8688","9688"]},
            {"subject_name": "Marine Science", "codes": ["9693"]},
            {"subject_name": "Mathematics", "codes": ["9231","9280","9709"]},
            {"subject_name": "Media Studies", "codes": ["9607"]},
            {"subject_name": "Music", "codes": ["9385","9483","9703","8663"]},
            {"subject_name": "Nepal Studies", "codes": ["8024"]},
            {"subject_name": "Physical Education", "codes": ["9396"]},
            {"subject_name": "Physical Science", "codes": ["8780"]},
            {"subject_name": "Physics", "codes": ["9702"]},
            {"subject_name": "Portuguese", "codes": ["8672","8684","9718"]},
            {"subject_name": "Psychology", "codes": ["9698","9990"]},
            {"subject_name": "Sociology", "codes": ["9699"]},
            {"subject_name": "Spanish", "codes": ["8022","8278","8279","8673","8685","9282","9719","8665","9844"]},
            {"subject_name": "Sport & Physical Education", "codes": ["8386"]},
            {"subject_name": "Tamil", "codes": ["8689","9689"]},
            {"subject_name": "Telugu", "codes": ["8690","9690"]},
            {"subject_name": "Thinking Skills", "codes": ["9694"]},
            {"subject_name": "Travel and Tourism", "codes": ["9395"]},
            {"subject_name": "Urdu", "codes": ["8686","9676","9686"]}
          ]
        }
      ]
    },
    {
      "board_key": "pearson",
      "display_name": "Pearson - Edexcel",
      "qualifications": [
        {
          "qual_key": "international_gcse",
          "display_name": "International GCSE (Current)",
          "branch_key": "current",
          "subjects": [
            {"subject_name": "Accounting", "codes": []},
            {"subject_name": "Arabic", "codes": []},
            {"subject_name": "Art and Design", "codes": []},
            {"subject_name": "Bangla", "codes": []},
            {"subject_name": "Bangladesh Studies", "codes": []},
            {"subject_name": "Bengali", "codes": []},
            {"subject_name": "Biology", "codes": []},
            {"subject_name": "Business", "codes": []},
            {"subject_name": "Chemistry", "codes": []},
            {"subject_name": "Chinese", "codes": []},
            {"subject_name": "Classical Arabic", "codes": []},
            {"subject_name": "Commerce", "codes": []},
            {"subject_name": "Computer Science", "codes": []},
            {"subject_name": "Economics", "codes": []},
            {"subject_name": "English as a Second Language", "codes": []},
            {"subject_name": "English Language A", "codes": []},
            {"subject_name": "English Language B", "codes": []},
            {"subject_name": "English Literature", "codes": []},
            {"subject_name": "French", "codes": []},
            {"subject_name": "Further Pure Mathematics", "codes": []},
            {"subject_name": "Geography", "codes": []},
            {"subject_name": "German", "codes": []},
            {"subject_name": "Global Citizenship", "codes": []},
            {"subject_name": "Greek (first language)", "codes": []},
            {"subject_name": "Gujarati", "codes": []},
            {"subject_name": "Hindi", "codes": []},
            {"subject_name": "History", "codes": []},
            {"subject_name": "Human Biology", "codes": []},
            {"subject_name": "Information and Communication Technology", "codes": []},
            {"subject_name": "Islamic Studies", "codes": []},
            {"subject_name": "Islamiyat", "codes": []},
            {"subject_name": "Mathematics A", "codes": []},
            {"subject_name": "Mathematics B", "codes": []},
            {"subject_name": "Modern Greek", "codes": []},
            {"subject_name": "Pakistan Studies", "codes": []},
            {"subject_name": "Physics", "codes": []},
            {"subject_name": "Religious Studies", "codes": []},
            {"subject_name": "Science (Double Award)", "codes": []},
            {"subject_name": "Science (Single Award)", "codes": []},
            {"subject_name": "Sinhala", "codes": []},
            {"subject_name": "Spanish", "codes": []},
            {"subject_name": "Swahili", "codes": []},
            {"subject_name": "Tamil", "codes": []},
            {"subject_name": "Turkish", "codes": []},
            {"subject_name": "Urdu", "codes": []}
          ]
        }
      ]
    },
    {
      "board_key": "ib",
      "display_name": "IB - International Baccalaureate",
      "programs": [
        {
          "qual_key": "myp",
          "display_name": "MYP (Middle Years Programme)",
          "subject_groups": [
            "Language acquisition",
            "Language and literature",
            "Individuals and societies",
            "Sciences",
            "Mathematics",
            "Arts",
            "Physical and health education",
            "Design"
          ]
        },
        {
          "qual_key": "dp",
          "display_name": "DP (Diploma Programme)",
          "subject_groups": [
            "Studies in language and literature",
            "Language acquisition",
            "Individuals and societies",
            "Sciences",
            "Mathematics",
            "The arts"
          ],
          "core": ["TOK","EE","CAS"]
        }
      ]
    }
  ]
}
```

---

## 4) Website Import Prompt (for your agent)

Copy/paste this section into your build agent.

### SYSTEM
You are a senior full-stack engineer. You will add board/qualification/program/subject seed data into an existing PapaCambridge-style curriculum app. Use snake_case only.

### TASK
1) Add the boards and all subject lists exactly as specified in Section 2.
2) Generate stable slugs for each subject.
   - If codes exist: `{kebab(subject_name)}-{first_code}`
   - If no codes: `{kebab(subject_name)}`
3) Insert seed data into the database tables:
   - boards
   - qualifications
   - qualification_branches (only when branch_key exists)
   - subjects
4) Generate website navigation from DB:
   - Curriculum screen lists boards.
   - Board screen lists qualifications/programs.
   - Qualification screen lists subjects with search.
5) Ensure no duplicate inserts:
   - use unique constraints and upsert logic.
6) Provide output:
   - a seed script (SQL or Python) that inserts everything
   - a verification query to count subjects per qualification
   - a JSON export endpoint `GET /api/seed/tree` that returns the same tree.

### ACCEPTANCE CHECKLIST
- CAIE IGCSE subjects appear and are searchable
- CAIE O Level subjects appear and are searchable
- CAIE AS & A Level subjects appear and are searchable
- Pearson iGCSE Current subjects appear and are searchable
- IB MYP + DP groups appear in the curriculum tree
- Clicking a subject routes to the subject resource hub

---

## 5) Verification Queries (DB sanity checks)

```sql
-- Count subjects per board + qualification
SELECT b.board_key, q.qual_key, COUNT(*) AS subject_count
FROM subjects s
JOIN boards b ON b.board_id = s.board_id
JOIN qualifications q ON q.qualification_id = s.qualification_id
GROUP BY b.board_key, q.qual_key
ORDER BY b.board_key, q.qual_key;

-- Find duplicates by name+code inside a qualification
SELECT b.board_key, q.qual_key, s.subject_name, s.subject_code, COUNT(*)
FROM subjects s
JOIN boards b ON b.board_id = s.board_id
JOIN qualifications q ON q.qualification_id = s.qualification_id
GROUP BY b.board_key, q.qual_key, s.subject_name, s.subject_code
HAVING COUNT(*) > 1;
```

---

End of document.

