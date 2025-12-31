// Country-specific phone number validation
// Maps country dial codes to expected phone number lengths (without country code)

const countryPhoneLengths = {
  // North America (NANP - 10 digits)
  '+1': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-268': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-264': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-684': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-246': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-441': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-242': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-767': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-809': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-473': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-671': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-876': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-869': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-345': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-758': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-670': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-664': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-868': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-721': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-649': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-784': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-284': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  '+1-340': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // India (10 digits)
  '+91': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // UK (10 digits)
  '+44': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Australia (9 digits)
  '+61': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // China (11 digits)
  '+86': { min: 11, max: 11, message: 'Phone number must be exactly 11 digits' },
  
  // Germany (10-11 digits)
  '+49': { min: 10, max: 11, message: 'Phone number must be 10-11 digits' },
  
  // France (9 digits)
  '+33': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Japan (10-11 digits)
  '+81': { min: 10, max: 11, message: 'Phone number must be 10-11 digits' },
  
  // Brazil (10-11 digits)
  '+55': { min: 10, max: 11, message: 'Phone number must be 10-11 digits' },
  
  // Russia (10 digits)
  '+7': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Pakistan (10 digits)
  '+92': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Bangladesh (10 digits)
  '+880': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Philippines (10 digits)
  '+63': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Indonesia (9-11 digits)
  '+62': { min: 9, max: 11, message: 'Phone number must be 9-11 digits' },
  
  // South Africa (9 digits)
  '+27': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Nigeria (10 digits)
  '+234': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Egypt (10 digits)
  '+20': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Turkey (10 digits)
  '+90': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Saudi Arabia (9 digits)
  '+966': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // UAE (9 digits)
  '+971': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Singapore (8 digits)
  '+65': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Malaysia (9-10 digits)
  '+60': { min: 9, max: 10, message: 'Phone number must be 9-10 digits' },
  
  // Thailand (9 digits)
  '+66': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Vietnam (9-10 digits)
  '+84': { min: 9, max: 10, message: 'Phone number must be 9-10 digits' },
  
  // South Korea (9-10 digits)
  '+82': { min: 9, max: 10, message: 'Phone number must be 9-10 digits' },
  
  // Italy (9-10 digits)
  '+39': { min: 9, max: 10, message: 'Phone number must be 9-10 digits' },
  
  // Spain (9 digits)
  '+34': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Canada (same as US - 10 digits)
  // Already covered by +1
  
  // Mexico (10 digits)
  '+52': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Argentina (10 digits)
  '+54': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Chile (9 digits)
  '+56': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Colombia (10 digits)
  '+57': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Peru (9 digits)
  '+51': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Netherlands (9 digits)
  '+31': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Belgium (9 digits)
  '+32': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Switzerland (9 digits)
  '+41': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Austria (10-13 digits)
  '+43': { min: 10, max: 13, message: 'Phone number must be 10-13 digits' },
  
  // Sweden (9 digits)
  '+46': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Norway (8 digits)
  '+47': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Denmark (8 digits)
  '+45': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Finland (9-10 digits)
  '+358': { min: 9, max: 10, message: 'Phone number must be 9-10 digits' },
  
  // Poland (9 digits)
  '+48': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Greece (10 digits)
  '+30': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Portugal (9 digits)
  '+351': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Ireland (9 digits)
  '+353': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // New Zealand (8-10 digits)
  '+64': { min: 8, max: 10, message: 'Phone number must be 8-10 digits' },
  
  // Israel (9 digits)
  '+972': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Kenya (9 digits)
  '+254': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Ghana (9 digits)
  '+233': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Morocco (9 digits)
  '+212': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Algeria (9 digits)
  '+213': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Tunisia (8 digits)
  '+216': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Iran (10 digits)
  '+98': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Iraq (10 digits)
  '+964': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Afghanistan (9 digits)
  '+93': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Nepal (10 digits)
  '+977': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Sri Lanka (9 digits)
  '+94': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Myanmar (8-10 digits)
  '+95': { min: 8, max: 10, message: 'Phone number must be 8-10 digits' },
  
  // Cambodia (8-9 digits)
  '+855': { min: 8, max: 9, message: 'Phone number must be 8-9 digits' },
  
  // Laos (8-10 digits)
  '+856': { min: 8, max: 10, message: 'Phone number must be 8-10 digits' },
  
  // Taiwan (9 digits)
  '+886': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Hong Kong (8 digits)
  '+852': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Macau (8 digits)
  '+853': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Qatar (8 digits)
  '+974': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Kuwait (8 digits)
  '+965': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Bahrain (8 digits)
  '+973': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Oman (8 digits)
  '+968': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Jordan (9 digits)
  '+962': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Lebanon (7-8 digits)
  '+961': { min: 7, max: 8, message: 'Phone number must be 7-8 digits' },
  
  // Syria (9 digits)
  '+963': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Yemen (9 digits)
  '+967': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Palestine (9 digits)
  '+970': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Kazakhstan (10 digits)
  '+7': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' }, // Same as Russia
  
  // Ukraine (9 digits)
  '+380': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Belarus (9 digits)
  '+375': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Uzbekistan (9 digits)
  '+998': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Kazakhstan (10 digits) - already covered by +7
  
  // Czech Republic (9 digits)
  '+420': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Hungary (9 digits)
  '+36': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Romania (10 digits)
  '+40': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Bulgaria (9 digits)
  '+359': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Croatia (9 digits)
  '+385': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Serbia (9-10 digits)
  '+381': { min: 9, max: 10, message: 'Phone number must be 9-10 digits' },
  
  // Slovenia (8-9 digits)
  '+386': { min: 8, max: 9, message: 'Phone number must be 8-9 digits' },
  
  // Slovakia (9 digits)
  '+421': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Lithuania (8 digits)
  '+370': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Latvia (8 digits)
  '+371': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Estonia (7-8 digits)
  '+372': { min: 7, max: 8, message: 'Phone number must be 7-8 digits' },
  
  // Iceland (7 digits)
  '+354': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Malta (8 digits)
  '+356': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Cyprus (8 digits)
  '+357': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Luxembourg (9 digits)
  '+352': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Monaco (9 digits)
  '+377': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Andorra (6 digits)
  '+376': { min: 6, max: 6, message: 'Phone number must be exactly 6 digits' },
  
  // San Marino (variable, use 6-10)
  '+378': { min: 6, max: 10, message: 'Phone number must be 6-10 digits' },
  
  // Vatican (variable, use 6-10)
  '+379': { min: 6, max: 10, message: 'Phone number must be 6-10 digits' },
  
  // Liechtenstein (7 digits)
  '+423': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Albania (9 digits)
  '+355': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Bosnia and Herzegovina (8-9 digits)
  '+387': { min: 8, max: 9, message: 'Phone number must be 8-9 digits' },
  
  // North Macedonia (8-9 digits)
  '+389': { min: 8, max: 9, message: 'Phone number must be 8-9 digits' },
  
  // Montenegro (8-9 digits)
  '+382': { min: 8, max: 9, message: 'Phone number must be 8-9 digits' },
  
  // Kosovo (8-9 digits)
  '+383': { min: 8, max: 9, message: 'Phone number must be 8-9 digits' },
  
  // Moldova (8 digits)
  '+373': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Armenia (8 digits)
  '+374': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Azerbaijan (9 digits)
  '+994': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Georgia (9 digits)
  '+995': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Kyrgyzstan (9 digits)
  '+996': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Tajikistan (9 digits)
  '+992': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Turkmenistan (8 digits)
  '+993': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Mongolia (8 digits)
  '+976': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Bhutan (8 digits)
  '+975': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Maldives (7 digits)
  '+960': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Brunei (7 digits)
  '+673': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // East Timor (7-8 digits)
  '+670': { min: 7, max: 8, message: 'Phone number must be 7-8 digits' },
  
  // Papua New Guinea (8 digits)
  '+675': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Fiji (7 digits)
  '+679': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Samoa (6-7 digits)
  '+685': { min: 6, max: 7, message: 'Phone number must be 6-7 digits' },
  
  // Tonga (5-7 digits)
  '+676': { min: 5, max: 7, message: 'Phone number must be 5-7 digits' },
  
  // Vanuatu (5-7 digits)
  '+678': { min: 5, max: 7, message: 'Phone number must be 5-7 digits' },
  
  // Solomon Islands (5-7 digits)
  '+677': { min: 5, max: 7, message: 'Phone number must be 5-7 digits' },
  
  // New Caledonia (6 digits)
  '+687': { min: 6, max: 6, message: 'Phone number must be exactly 6 digits' },
  
  // French Polynesia (6 digits)
  '+689': { min: 6, max: 6, message: 'Phone number must be exactly 6 digits' },
  
  // Cook Islands (5 digits)
  '+682': { min: 5, max: 5, message: 'Phone number must be exactly 5 digits' },
  
  // Niue (4 digits)
  '+683': { min: 4, max: 4, message: 'Phone number must be exactly 4 digits' },
  
  // Tokelau (4 digits)
  '+690': { min: 4, max: 4, message: 'Phone number must be exactly 4 digits' },
  
  // Tuvalu (5-6 digits)
  '+688': { min: 5, max: 6, message: 'Phone number must be 5-6 digits' },
  
  // Nauru (7 digits)
  '+674': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Palau (7 digits)
  '+680': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Marshall Islands (7 digits)
  '+692': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Micronesia (7 digits)
  '+691': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Kiribati (5-8 digits)
  '+686': { min: 5, max: 8, message: 'Phone number must be 5-8 digits' },
  
  // Wallis and Futuna (6 digits)
  '+681': { min: 6, max: 6, message: 'Phone number must be exactly 6 digits' },
  
  // Pitcairn (variable, use 4-8)
  '+870': { min: 4, max: 8, message: 'Phone number must be 4-8 digits' },
  
  // Ethiopia (9 digits)
  '+251': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Tanzania (9 digits)
  '+255': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Uganda (9 digits)
  '+256': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Rwanda (9 digits)
  '+250': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Burundi (8 digits)
  '+257': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Democratic Republic of Congo (9 digits)
  '+243': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Republic of Congo (9 digits)
  '+242': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Central African Republic (8 digits)
  '+236': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Chad (8 digits)
  '+235': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Cameroon (9 digits)
  '+237': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Equatorial Guinea (9 digits)
  '+240': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Gabon (8 digits)
  '+241': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // São Tomé and Príncipe (7 digits)
  '+239': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Angola (9 digits)
  '+244': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Mozambique (9 digits)
  '+258': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Zambia (9 digits)
  '+260': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Zimbabwe (9 digits)
  '+263': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Botswana (8 digits)
  '+267': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Namibia (9 digits)
  '+264': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Lesotho (8 digits)
  '+266': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Swaziland/Eswatini (8 digits)
  '+268': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Malawi (9 digits)
  '+265': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Madagascar (9 digits)
  '+261': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Mauritius (8 digits)
  '+230': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Seychelles (7 digits)
  '+248': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Comoros (7 digits)
  '+269': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Djibouti (6 digits)
  '+253': { min: 6, max: 6, message: 'Phone number must be exactly 6 digits' },
  
  // Eritrea (7 digits)
  '+291': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Somalia (7-8 digits)
  '+252': { min: 7, max: 8, message: 'Phone number must be 7-8 digits' },
  
  // Sudan (9 digits)
  '+249': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // South Sudan (9 digits)
  '+211': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Libya (9 digits)
  '+218': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Mali (8 digits)
  '+223': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Burkina Faso (8 digits)
  '+226': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Niger (8 digits)
  '+227': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Senegal (9 digits)
  '+221': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Gambia (7 digits)
  '+220': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Guinea-Bissau (7 digits)
  '+245': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Guinea (9 digits)
  '+224': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Sierra Leone (8 digits)
  '+232': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Liberia (7-8 digits)
  '+231': { min: 7, max: 8, message: 'Phone number must be 7-8 digits' },
  
  // Côte d'Ivoire (10 digits)
  '+225': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Togo (8 digits)
  '+228': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Benin (8 digits)
  '+229': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Mauritania (8 digits)
  '+222': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Cape Verde (7 digits)
  '+238': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Costa Rica (8 digits)
  '+506': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Panama (8 digits)
  '+507': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Nicaragua (8 digits)
  '+505': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Honduras (8 digits)
  '+504': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // El Salvador (8 digits)
  '+503': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Guatemala (8 digits)
  '+502': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Belize (7 digits)
  '+501': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Cuba (8 digits)
  '+53': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Jamaica (10 digits) - already covered by +1-876
  
  // Haiti (8 digits)
  '+509': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Dominican Republic (10 digits) - already covered by +1-809
  
  // Trinidad and Tobago (10 digits) - already covered by +1-868
  
  // Guyana (7 digits)
  '+592': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Suriname (7 digits)
  '+597': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // French Guiana (9 digits) - same as France
  '+594': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Ecuador (9 digits)
  '+593': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Bolivia (8 digits)
  '+591': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Paraguay (9 digits)
  '+595': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Uruguay (8 digits)
  '+598': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // Venezuela (10 digits)
  '+58': { min: 10, max: 10, message: 'Phone number must be exactly 10 digits' },
  
  // Greenland (6 digits)
  '+299': { min: 6, max: 6, message: 'Phone number must be exactly 6 digits' },
  
  // Faroe Islands (6 digits)
  '+298': { min: 6, max: 6, message: 'Phone number must be exactly 6 digits' },
  
  // Åland Islands (variable, use 6-10)
  '+358': { min: 6, max: 10, message: 'Phone number must be 6-10 digits' }, // Same as Finland
  
  // Svalbard and Jan Mayen (8 digits) - same as Norway
  '+47': { min: 8, max: 8, message: 'Phone number must be exactly 8 digits' },
  
  // British Indian Ocean Territory (variable, use 4-8)
  '+246': { min: 4, max: 8, message: 'Phone number must be 4-8 digits' },
  
  // Saint Helena (4 digits)
  '+290': { min: 4, max: 4, message: 'Phone number must be exactly 4 digits' },
  
  // Ascension Island (4 digits) - same as Saint Helena
  '+247': { min: 4, max: 4, message: 'Phone number must be exactly 4 digits' },
  
  // Tristan da Cunha (variable, use 4-8)
  '+290': { min: 4, max: 8, message: 'Phone number must be 4-8 digits' },
  
  // Falkland Islands (5 digits)
  '+500': { min: 5, max: 5, message: 'Phone number must be exactly 5 digits' },
  
  // South Georgia and the South Sandwich Islands (variable, use 4-8)
  '+500': { min: 4, max: 8, message: 'Phone number must be 4-8 digits' },
  
  // Antarctica (variable, use 4-8)
  '+672': { min: 4, max: 8, message: 'Phone number must be 4-8 digits' },
  
  // Bouvet Island (variable, use 4-8)
  '+47': { min: 4, max: 8, message: 'Phone number must be 4-8 digits' }, // Same as Norway
  
  // Heard Island and McDonald Islands (variable, use 4-8)
  '+672': { min: 4, max: 8, message: 'Phone number must be 4-8 digits' }, // Same as Antarctica
  
  // French Southern Territories (variable, use 4-8)
  '+262': { min: 4, max: 8, message: 'Phone number must be 4-8 digits' },
  
  // Mayotte (9 digits) - same as France
  '+262': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Réunion (9 digits) - same as France
  '+262': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Saint Pierre and Miquelon (6 digits)
  '+508': { min: 6, max: 6, message: 'Phone number must be exactly 6 digits' },
  
  // Guadeloupe (9 digits) - same as France
  '+590': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Martinique (9 digits) - same as France
  '+596': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Saint Barthélemy (9 digits) - same as France
  '+590': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Saint Martin (French part) (9 digits) - same as France
  '+590': { min: 9, max: 9, message: 'Phone number must be exactly 9 digits' },
  
  // Aruba (7 digits)
  '+297': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Curaçao (7 digits)
  '+599': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' },
  
  // Sint Maarten (Dutch part) (10 digits) - already covered by +1-721
  
  // Bonaire, Sint Eustatius and Saba (7 digits)
  '+599': { min: 7, max: 7, message: 'Phone number must be exactly 7 digits' }, // Same as Curaçao
  
  // Anguilla (10 digits) - already covered by +1-264
  
  // Montserrat (10 digits) - already covered by +1-664
  
  // Turks and Caicos Islands (10 digits) - already covered by +1-649
  
  // British Virgin Islands (10 digits) - already covered by +1-284
  
  // US Virgin Islands (10 digits) - already covered by +1-340
  
  // Cayman Islands (10 digits) - already covered by +1-345
  
  // Bermuda (10 digits) - already covered by +1-441
  
  // Puerto Rico (10 digits) - already covered by +1
  
  // Guam (10 digits) - already covered by +1-671
  
  // Northern Mariana Islands (10 digits) - already covered by +1-670
  
  // American Samoa (10 digits) - already covered by +1-684
  
  // US Minor Outlying Islands (10 digits) - already covered by +1
  
  // Default fallback for countries not in the list
  'default': { min: 10, max: 15, message: 'Phone number must be 10-15 digits' }
};

/**
 * Get phone validation schema based on country dial code
 * @param {string} dialCode - Country dial code (e.g., '+1', '+91', '+44')
 * @returns {object} Validation schema for react-hook-form
 */
export const getPhoneValidationSchema = (dialCode) => {
  const config = countryPhoneLengths[dialCode] || countryPhoneLengths['default'];
  
  return {
    required: 'Phone number is required',
    minLength: { 
      value: config.min, 
      message: `Phone number must be at least ${config.min} digits` 
    },
    maxLength: { 
      value: config.max, 
      message: `Phone number cannot exceed ${config.max} digits` 
    },
    pattern: { 
      value: /^[0-9]+$/, 
      message: 'Phone number must contain only digits' 
    },
    validate: {
      notEmpty: (value) => {
        if (!value) return 'Phone number is required';
        const trimmed = value.toString().trim();
        return trimmed.length >= config.min || `Phone number must be at least ${config.min} digits`;
      },
      onlyDigits: (value) => {
        if (!value) return 'Phone number is required';
        return /^[0-9]+$/.test(value.toString().trim()) || 'Phone number must contain only digits';
      },
      length: (value) => {
        if (!value) return 'Phone number is required';
        const trimmed = value.toString().trim();
        if (trimmed.length < config.min) {
          return `Phone number must be at least ${config.min} digits`;
        }
        if (trimmed.length > config.max) {
          return `Phone number cannot exceed ${config.max} digits`;
        }
        return true;
      },
      countrySpecific: (value) => {
        if (!value) return 'Phone number is required';
        const trimmed = value.toString().trim();
        if (config.min === config.max) {
          // Exact length required
          return trimmed.length === config.min || config.message;
        } else {
          // Range of lengths
          return (trimmed.length >= config.min && trimmed.length <= config.max) || config.message;
        }
      }
    }
  };
};

