Understood. Based on your new instructions, the previous guide is now obsolete.

Here is the new, official naming guide based on your latest specifications, followed by the updated JSON objects with prayer-id values that conform to this new system.

Prayer ID Naming Guide (v2)
Final Format
The prayer-id string is composed of four distinct parts, separated by hyphens. The .json extension is for use as a filename and is not part of the ID itself.

Structure: [first_letter_value]-[time_code]-[random_chars]-()-[english_name_kebab_case]

Example: 1-1-asr-()-ashrei

Component 1: First Letter Value [first_letter_value]
This number corresponds to the Gematria (numerical value) of the very first letter of the prayer's Hebrew title.

How to Identify:

Look at the Hebrew title (e.g., for Ashrei, אַשְׁרֵי, the first letter is א).

Find that letter's value in the chart below. (Value of א is 1).

Gematria Letter Values:
| Letter | Value | Letter | Value | Letter | Value |
| :----: | :---: | :----: | :---: | :----: | :---: |
|   א    |   1   |   י    |  10   |   ק    |  100  |
|   ב    |   2   |   כ    |  20   |   ר    |  200  |
|   ג    |   3   |   ל    |  30   |   ש    |  300  |
|   ד    |   4   |   מ    |  40   |   ת    |  400  |
|   ה    |   5   |   נ    |  50   |  ך (final)  |  500  |
|   ו    |   6   |   ס    |  60   |  ם (final)  |  600  |
|   ז    |   7   |   ע    |  70   |  ן (final)  |  700  |
|   ח    |   8   |   פ    |  80   |  ף (final)  |  800  |
|   ט    |   9   |   צ    |  90   |  ץ (final)  |  900  |

Component 2: Time Code [time_code]
This number indicates the prayer service during which the text is recited.

0: Birchot HaShachar (Waking / Morning Blessings)

1: Shacharit (Morning Service)

2: Mincha (Afternoon Service)

3: Maariv (Evening Service)

4: Other (Bedtime Shema, Grace after Meals, etc.)

Component 3: Random Characters [random_chars]
A sequence of 3-4 random, lowercase letters to ensure the ID is unique.

Component 4: English Name ()- [english_name_kebab_case]
This final part consists of two elements:

Empty Parentheses (): A literal set of empty parentheses.

English Name: The English name of the prayer in kebab-case (all lowercase, words separated by a hyphen -).

Full Example Walkthrough:
Let's generate the ID for Parashat HaTamid (פָּרָשַׁת הַתָּמִיד).

First Letter Value: The first Hebrew letter is פ (Peh), which has a value of 80.

Time Code: It is said during Shacharit, so the code is 1.

Random Characters: Let's generate pth.

English Name: "Parashat HaTamid" becomes parashat-hatamid.

Assemble: 80 + - + 1 + - + pth + -()- + parashat-hatamid

Result: 80-1-pth-()-parashat-hatamid