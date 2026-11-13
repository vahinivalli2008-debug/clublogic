const DEFAULT_CLUBS = [
  {id:"coding",name:"Coding Club",gpa:6.0,attendance:75,interest:"programming",color:"#237a75"},
  {id:"robotics",name:"Robotics Club",gpa:6.0,attendance:75,interest:"electronics",color:"#52718a"},
  {id:"literary",name:"Literary Club",gpa:5.5,attendance:70,interest:"writing",color:"#a26750"},
  {id:"eco",name:"Eco Club",gpa:5.0,attendance:70,interest:"environment",color:"#718353"}
];
const STORAGE_KEY = "clublogic.clubs.v1";
const CLUB_ID_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

let storageWarning = "";

function clubsById(clubs){
  const result=Object.create(null);
  clubs.forEach(club=>{result[club.id]={...club};});
  return result;
}

function validateClub(club){
  if(!club||typeof club!=="object"||
    typeof club.id!=="string"||!CLUB_ID_PATTERN.test(club.id)||
    typeof club.name!=="string"||!club.name.trim()||club.name.length>60||
    !Number.isFinite(club.gpa)||club.gpa<0||club.gpa>10||
    !Number.isInteger(club.attendance)||club.attendance<0||club.attendance>100||
    typeof club.interest!=="string"||!CLUB_ID_PATTERN.test(club.interest)||
    typeof club.color!=="string"||!COLOR_PATTERN.test(club.color)){
    throw new Error("A saved club has invalid details.");
  }
  return {...club,name:club.name.trim(),color:club.color.toLowerCase()};
}

function loadClubs(){
  try{
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved===null)return clubsById(DEFAULT_CLUBS);
    const parsed=JSON.parse(saved);
    if(!Array.isArray(parsed)||parsed.length===0)throw new Error("Saved club data must be a non-empty list.");
    const clubs=parsed.map(validateClub);
    const ids=new Set(),names=new Set();
    for(const club of clubs){
      const normalizedName=club.name.toLocaleLowerCase();
      if(ids.has(club.id)||names.has(normalizedName))throw new Error("Saved clubs contain duplicate IDs or names.");
      ids.add(club.id);
      names.add(normalizedName);
    }
    return clubsById(clubs);
  }catch(error){
    storageWarning="Saved clubs could not be loaded. The built-in clubs are shown instead; your saved data was not changed.";
    return clubsById(DEFAULT_CLUBS);
  }
}

let CLUBS=loadClubs();

function formatInterest(interest){
  return interest.replace(/_/g," ");
}

function toSlug(value){
  let slug=value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,40);
  if(slug&&!/^[a-z]/.test(slug))slug="club_"+slug;
  return slug;
}

function buildProlog(){
  const facts=Object.values(CLUBS).map(club=>
    `club(${club.id}, ${club.gpa.toFixed(1)}, ${club.attendance}, ${club.interest}).`
  ).join("\n");
  return `% CAMPUS CLUB MEMBERSHIP ELIGIBILITY REASONER
% CLUB REQUIREMENTS
% club(Name, MinimumCGPA, MinimumAttendance, Interest).

${facts}

% CHECK CGPA
failed_condition(Club, GPA, _, _, 'Minimum CGPA requirement') :-
    club(Club, Minimum, _, _),
    GPA < Minimum.

% CHECK ATTENDANCE
failed_condition(Club, _, Attendance, _, 'Minimum attendance requirement') :-
    club(Club, _, Minimum, _),
    Attendance < Minimum.

% CHECK INTEREST
failed_condition(Club, _, _, Interest, 'Required interest for the club') :-
    club(Club, _, _, Required),
    Interest \\= Required.

% MAIN ELIGIBILITY RULE
check_eligibility(Club, GPA, Attendance, Interest, Result, Reasons) :-
    club(Club, _, _, _),
    findall(
        Reason,
        failed_condition(Club, GPA, Attendance, Interest, Reason),
        Reasons
    ),
    (
        Reasons = [] ->
        Result = eligible
        ;
        Result = not_eligible
    ).`;
}

function evaluate(clubKey,gpa,attendance,interest){
  const club=CLUBS[clubKey];
  if(!club)return {valid:false,reasons:["Unknown club"]};
  const checks=[
    {name:"Minimum CGPA requirement",ok:Number(gpa)>=club.gpa,detail:`Your CGPA: ${Number(gpa).toFixed(1)} · Required: ${club.gpa.toFixed(1)} or above`},
    {name:"Minimum attendance requirement",ok:Number(attendance)>=club.attendance,detail:`Your attendance: ${Number(attendance)}% · Required: ${club.attendance}% or above`},
    {name:"Required interest for the club",ok:interest===club.interest,detail:`Your interest: ${formatInterest(interest)} · Required: ${formatInterest(club.interest)}`}
  ];
  return {valid:true,eligible:checks.every(check=>check.ok),checks,reasons:checks.filter(check=>!check.ok).map(check=>check.name)};
}

function showResult(target,clubKey,gpa,attendance,interest){
  const result=evaluate(clubKey,gpa,attendance,interest);
  const club=CLUBS[clubKey];
  target.className="result "+(result.eligible?"eligible":"ineligible");
  const icon=document.createElement("div");
  icon.className="result-icon";
  icon.textContent=result.eligible?"✓":"!";
  const heading=document.createElement("h3");
  heading.textContent=`${result.eligible?"Eligible":"Not eligible"} for ${club.name}`;
  const message=document.createElement("p");
  message.textContent=result.eligible
    ?"All three Prolog conditions passed. The Reasons list is empty."
    :"The following condition(s) failed:";
  target.replaceChildren(icon,heading,message);
  if(result.eligible){
    const reasons=document.createElement("p");
    reasons.className="success-text";
    reasons.textContent="Reasons = []";
    target.append(reasons);
  }else{
    const list=document.createElement("ul");
    list.className="reason-list";
    result.reasons.forEach(reason=>{
      const item=document.createElement("li");
      item.textContent=reason;
      list.append(item);
    });
    target.append(list);
  }
  return result;
}

function setClubStatus(message,tone="success"){
  const status=document.getElementById("club-status");
  status.textContent=message;
  status.dataset.tone=tone;
  status.classList.toggle("hidden",!message);
}

function persistClubs(clubs){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(Object.values(clubs)));
    return true;
  }catch(error){
    setClubStatus("Could not save your clubs in this browser. Check browser storage availability and try again.","error");
    return false;
  }
}

function addOption(select,value,label){
  const option=document.createElement("option");
  option.value=value;
  option.textContent=label;
  select.append(option);
}

function renderClubSelect(select){
  const previous=select.value;
  select.replaceChildren();
  Object.values(CLUBS).forEach(club=>addOption(select,club.id,club.name));
  select.value=CLUBS[previous]?previous:Object.keys(CLUBS)[0];
}

function renderInterestSelect(select){
  const previous=select.value;
  const interests=[...new Set(Object.values(CLUBS).map(club=>club.interest))];
  select.replaceChildren();
  interests.forEach(interest=>addOption(select,interest,formatInterest(interest)));
  select.value=interests.includes(previous)?previous:interests[0];
}

function makeRequirement(label,value){
  const paragraph=document.createElement("p");
  paragraph.append(document.createTextNode(label+" "));
  const strong=document.createElement("strong");
  strong.textContent=value;
  paragraph.append(strong);
  return paragraph;
}

function renderClubCards(){
  const cards=document.getElementById("club-cards");
  cards.replaceChildren();
  Object.values(CLUBS).forEach(club=>{
    const card=document.createElement("article");
    card.className="club-card";
    card.style.setProperty("--club-accent",club.color);
    const eyebrow=document.createElement("div");
    eyebrow.className="eyebrow";
    eyebrow.textContent=club.id.replace(/_/g," ").toUpperCase();
    const heading=document.createElement("h3");
    heading.textContent=club.name;
    const interest=document.createElement("div");
    interest.className="interest";
    interest.textContent=`Interest: ${formatInterest(club.interest)}`;
    card.append(
      eyebrow,
      heading,
      makeRequirement("Minimum CGPA:",`${club.gpa.toFixed(1)}/10`),
      makeRequirement("Minimum attendance:",`${club.attendance}%`),
      interest
    );
    const edit=document.createElement("button");
    edit.className="btn small secondary edit-club";
    edit.type="button";
    edit.dataset.editClub=club.id;
    edit.setAttribute("aria-label",`Edit ${club.name}`);
    edit.textContent="Edit";
    card.append(edit);
    cards.append(card);
  });
}

const BASE_TESTS=[
  ["coding",8.5,90,"programming"],
  ["coding",5.0,60,"writing"],
  ["robotics",6.0,75,"electronics"],
  ["literary",5.4,80,"writing"],
  ["eco",5.0,70,"environment"],
  ["eco",7.0,69,"environment"]
];

function renderTests(){
  const tests=[...BASE_TESTS];
  Object.values(CLUBS).filter(club=>!BASE_TESTS.some(test=>test[0]===club.id))
    .forEach(club=>tests.push([club.id,club.gpa,club.attendance,club.interest]));
  const rows=document.getElementById("test-rows");
  rows.replaceChildren();
  tests.forEach(test=>{
    const result=evaluate(test[0],test[1],test[2],test[3]);
    const row=document.createElement("tr");
    const values=[
      CLUBS[test[0]].name,
      test[1].toFixed(1),
      `${test[2]}%`,
      formatInterest(test[3]),
      result.eligible?"Eligible":"Not eligible"
    ];
    values.forEach(value=>{
      const cell=document.createElement("td");
      cell.textContent=value;
      row.append(cell);
    });
    const actionCell=document.createElement("td");
    const button=document.createElement("button");
    button.className="btn small secondary";
    button.type="button";
    button.textContent="Try";
    button.addEventListener("click",()=>{
      document.getElementById("club").value=test[0];
      document.getElementById("gpa").value=test[1];
      document.getElementById("attendance").value=test[2];
      document.getElementById("interest").value=test[3];
      document.getElementById("eligibility-form").requestSubmit();
      location.hash="#checker";
    });
    actionCell.append(button);
    row.append(actionCell);
    rows.append(row);
  });
}

function updateSimulator(){
  const gpa=Number(document.getElementById("sim-gpa").value);
  const attendance=Number(document.getElementById("sim-att").value);
  const interest=document.getElementById("sim-interest").value;
  const clubKey=document.getElementById("sim-club").value;
  document.getElementById("sim-gpa-value").textContent=gpa.toFixed(1);
  document.getElementById("sim-att-value").textContent=`${attendance}%`;
  const result=evaluate(clubKey,gpa,attendance,interest);
  const output=document.getElementById("sim-result");
  output.classList.toggle("eligible",result.eligible);
  output.classList.toggle("ineligible",!result.eligible);
  output.textContent=result.eligible
    ?`✓ Eligible for ${CLUBS[clubKey].name}`
    :`Not eligible: ${result.reasons.join("; ")}`;
}

function renderAll(){
  document.getElementById("club-count").textContent=String(Object.keys(CLUBS).length);
  renderClubSelect(document.getElementById("club"));
  renderClubSelect(document.getElementById("sim-club"));
  renderInterestSelect(document.getElementById("interest"));
  renderInterestSelect(document.getElementById("sim-interest"));
  renderClubCards();
  renderTests();
  document.getElementById("prolog-code").textContent=buildProlog();
  updateSimulator();
}

const clubForm=document.getElementById("club-form");
const clubEditor=document.getElementById("club-editor");
let editingClubId=null;

function closeClubEditor(){
  clubEditor.classList.add("hidden");
  editingClubId=null;
  clubForm.reset();
}

function openClubEditor(clubId=null){
  editingClubId=clubId;
  clubForm.reset();
  const title=document.getElementById("club-editor-title");
  if(clubId){
    const club=CLUBS[clubId];
    document.getElementById("club-name").value=club.name;
    document.getElementById("club-interest").value=formatInterest(club.interest);
    document.getElementById("club-gpa").value=club.gpa;
    document.getElementById("club-attendance").value=club.attendance;
    document.getElementById("club-color").value=club.color;
    title.textContent="Edit club";
  }else{
    document.getElementById("club-gpa").value="6.0";
    document.getElementById("club-attendance").value="75";
    document.getElementById("club-color").value="#237a75";
    title.textContent="Add a club";
  }
  clubEditor.classList.remove("hidden");
  document.getElementById("club-name").focus();
}

document.getElementById("add-club").addEventListener("click",()=>openClubEditor());
document.getElementById("cancel-club").addEventListener("click",closeClubEditor);
document.getElementById("club-cards").addEventListener("click",event=>{
  const button=event.target.closest("[data-edit-club]");
  if(button)openClubEditor(button.dataset.editClub);
});
clubForm.addEventListener("submit",event=>{
  event.preventDefault();
  const name=document.getElementById("club-name").value.trim();
  const interest=toSlug(document.getElementById("club-interest").value);
  const gpa=Number(document.getElementById("club-gpa").value);
  const attendance=Number(document.getElementById("club-attendance").value);
  const color=document.getElementById("club-color").value.toLowerCase();
  if(!name||!interest||!Number.isFinite(gpa)||gpa<0||gpa>10||
    !Number.isInteger(attendance)||attendance<0||attendance>100||!COLOR_PATTERN.test(color)){
    setClubStatus("Enter a valid name, interest, CGPA, attendance, and color.","error");
    return;
  }
  const duplicateName=Object.values(CLUBS).some(club=>
    club.id!==editingClubId&&club.name.toLocaleLowerCase()===name.toLocaleLowerCase()
  );
  if(duplicateName){
    setClubStatus("A club with that name already exists. Choose a different name.","error");
    return;
  }
  const id=editingClubId||toSlug(name);
  if(!id||(!editingClubId&&CLUBS[id])){
    setClubStatus("That club name is already in use or cannot be used as a rule identifier. Choose a different name.","error");
    return;
  }
  const isEditing=editingClubId!==null;
  const nextClubs=Object.assign(Object.create(null),CLUBS,{[id]:{id,name,gpa,attendance,interest,color}});
  if(!persistClubs(nextClubs))return;
  CLUBS=nextClubs;
  closeClubEditor();
  renderAll();
  setClubStatus(`${name} ${isEditing?"updated":"added"} in this browser.`);
});

document.getElementById("eligibility-form").addEventListener("submit",event=>{
  event.preventDefault();
  const club=document.getElementById("club").value;
  const gpa=Number(document.getElementById("gpa").value);
  const attendance=Number(document.getElementById("attendance").value);
  const interest=document.getElementById("interest").value;
  if(gpa<0||gpa>10||attendance<0||attendance>100){
    alert("Enter CGPA from 0 to 10 and attendance from 0 to 100.");
    return;
  }
  const result=showResult(document.getElementById("result"),club,gpa,attendance,interest);
  if(!result.valid)return;
  const proof=document.getElementById("proof");
  const list=document.getElementById("proof-list");
  list.replaceChildren();
  result.checks.forEach(check=>{
    const row=document.createElement("div");
    row.className="proof-row";
    const description=document.createElement("span");
    description.append(document.createTextNode(check.name));
    const detail=document.createElement("small");
    detail.className="muted";
    detail.textContent=check.detail;
    description.append(document.createElement("br"),detail);
    const status=document.createElement("b");
    status.className=check.ok?"pass":"fail";
    status.textContent=check.ok?"PASSED":"FAILED";
    row.append(description,status);
    list.append(row);
  });
  proof.classList.remove("hidden");
});

["sim-gpa","sim-att","sim-interest","sim-club"].forEach(id=>
  document.getElementById(id).addEventListener("input",updateSimulator)
);

document.getElementById("prolog-code").textContent=buildProlog();
document.getElementById("copy-code").addEventListener("click",async()=>{
  const button=document.getElementById("copy-code");
  try{
    await navigator.clipboard.writeText(buildProlog());
    button.textContent="Copied!";
  }catch(error){
    button.textContent="Copy unavailable";
  }
});

function parseQuery(query){
  const match=query.trim().match(/^check_eligibility\(\s*([a-z][a-z0-9_]*)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*([a-z][a-z0-9_]*)\s*,\s*([A-Z_]\w*)\s*,\s*([A-Z_]\w*)\s*\)\.?$/i);
  if(!match)return null;
  return {
    club:match[1].toLowerCase(),
    gpa:Number(match[2]),
    attendance:Number(match[3]),
    interest:match[4].toLowerCase(),
    resultVar:match[5],
    reasonsVar:match[6]
  };
}

document.getElementById("run-query").addEventListener("click",()=>{
  const query=document.getElementById("query").value;
  const parsed=parseQuery(query);
  const output=document.getElementById("query-output");
  if(!parsed){
    output.textContent="Query format not recognised. Use: check_eligibility(coding, 8.5, 90, programming, Result, Reasons).";
    return;
  }
  const result=evaluate(parsed.club,parsed.gpa,parsed.attendance,parsed.interest);
  if(!result.valid){
    output.textContent=`Unknown club: ${parsed.club}.`;
    return;
  }
  const reasons=result.reasons.map(reason=>"'"+reason+"'").join(", ");
  output.textContent=`${parsed.resultVar} = ${result.eligible?"eligible":"not_eligible"},\n${parsed.reasonsVar} = [${reasons}].`;
});

if(storageWarning)setClubStatus(storageWarning,"error");
renderAll();
