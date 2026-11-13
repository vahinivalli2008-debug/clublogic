const CLUBS = {
  coding: {name:"Coding Club",gpa:6.0,attendance:75,interest:"programming"},
  robotics: {name:"Robotics Club",gpa:6.0,attendance:75,interest:"electronics"},
  literary: {name:"Literary Club",gpa:5.5,attendance:70,interest:"writing"},
  eco: {name:"Eco Club",gpa:5.0,attendance:70,interest:"environment"}
};
const PROLOG = `% CAMPUS CLUB MEMBERSHIP ELIGIBILITY REASONER
% CLUB REQUIREMENTS
% club(Name, MinimumCGPA, MinimumAttendance, Interest).

club(coding, 6.0, 75, programming).
club(robotics, 6.0, 75, electronics).
club(literary, 5.5, 70, writing).
club(eco, 5.0, 70, environment).

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

function evaluate(clubKey,gpa,attendance,interest){
  const c=CLUBS[clubKey]; if(!c) return {valid:false,reasons:["Unknown club"]};
  const checks=[
    {name:"Minimum CGPA requirement",ok:Number(gpa)>=c.gpa,detail:`Your CGPA: ${Number(gpa).toFixed(1)} · Required: ${c.gpa.toFixed(1)} or above`},
    {name:"Minimum attendance requirement",ok:Number(attendance)>=c.attendance,detail:`Your attendance: ${Number(attendance)}% · Required: ${c.attendance}% or above`},
    {name:"Required interest for the club",ok:interest===c.interest,detail:`Your interest: ${interest} · Required: ${c.interest}`}
  ];
  return {valid:true,eligible:checks.every(x=>x.ok),checks,reasons:checks.filter(x=>!x.ok).map(x=>x.name)};
}
function showResult(target,club,gpa,attendance,interest){
  const r=evaluate(club,gpa,attendance,interest), c=CLUBS[club];
  if(!r.valid){target.textContent="Please select a valid club.";return;}
  target.className="result "+(r.eligible?"eligible":"ineligible");
  target.innerHTML=`<div class="result-icon">${r.eligible?"✓":"!"}</div><h3>${r.eligible?"Eligible":"Not eligible"} for ${c.name}</h3>
    <p>${r.eligible?"All three Prolog conditions passed. The Reasons list is empty.":"The following condition(s) failed:"}</p>
    ${r.eligible?'<p class="success-text">Reasons = []</p>':`<ul class="reason-list">${r.reasons.map(x=>`<li>${x}</li>`).join("")}</ul>`}`;
  return r;
}
document.getElementById("eligibility-form").addEventListener("submit",e=>{
  e.preventDefault();
  const club=document.getElementById("club").value,gpa=Number(document.getElementById("gpa").value),att=Number(document.getElementById("attendance").value),interest=document.getElementById("interest").value;
  if(gpa<0||gpa>10||att<0||att>100){alert("Enter CGPA from 0 to 10 and attendance from 0 to 100.");return;}
  const target=document.getElementById("result");const r=showResult(target,club,gpa,att,interest);
  const proof=document.getElementById("proof"),list=document.getElementById("proof-list");
  proof.classList.remove("hidden");
  list.innerHTML=r.checks.map(x=>`<div class="proof-row"><span>${x.name}<br><small class="muted">${x.detail}</small></span><b class="${x.ok?"pass":"fail"}">${x.ok?"PASSED":"FAILED"}</b></div>`).join("");
});
document.getElementById("club-cards").innerHTML=Object.entries(CLUBS).map(([id,c])=>`<article class="club-card"><div class="eyebrow">${id.toUpperCase()}</div><h3>${c.name}</h3><p>Minimum CGPA: <strong>${c.gpa.toFixed(1)}/10</strong></p><p>Minimum attendance: <strong>${c.attendance}%</strong></p><div class="interest">Interest: ${c.interest}</div></article>`).join("");
function updateSimulator(){
 const g=Number(document.getElementById("sim-gpa").value),a=Number(document.getElementById("sim-att").value),i=document.getElementById("sim-interest").value,c=document.getElementById("sim-club").value;
 document.getElementById("sim-gpa-value").textContent=g.toFixed(1);document.getElementById("sim-att-value").textContent=a+"%";
 const r=evaluate(c,g,a,i),el=document.getElementById("sim-result");
 el.style.color=r.eligible?"#48d597":"#ff7d8a";
 el.textContent=r.eligible?`✓ Eligible for ${CLUBS[c].name}`:`Not eligible: ${r.reasons.join("; ")}`;
}
["sim-gpa","sim-att","sim-interest","sim-club"].forEach(id=>document.getElementById(id).addEventListener("input",updateSimulator));
updateSimulator();
const tests=[
 ["coding",8.5,90,"programming",true],
 ["coding",5.0,60,"writing",false],
 ["robotics",6.0,75,"electronics",true],
 ["literary",5.4,80,"writing",false],
 ["eco",5.0,70,"environment",true],
 ["eco",7.0,69,"environment",false]
];
document.getElementById("test-rows").innerHTML=tests.map((t,n)=>`<tr><td>${CLUBS[t[0]].name}</td><td>${t[1]}</td><td>${t[2]}%</td><td>${t[3]}</td><td>${t[4]?"Eligible":"Not eligible"}</td><td><button class="btn small secondary" data-test="${n}">Try</button></td></tr>`).join("");
document.querySelectorAll("[data-test]").forEach(b=>b.addEventListener("click",()=>{
 const t=tests[Number(b.dataset.test)];document.getElementById("club").value=t[0];document.getElementById("gpa").value=t[1];document.getElementById("attendance").value=t[2];document.getElementById("interest").value=t[3];document.getElementById("eligibility-form").requestSubmit();location.hash="#checker";
}));
document.getElementById("prolog-code").textContent=PROLOG;
document.getElementById("copy-code").addEventListener("click",async()=>{await navigator.clipboard.writeText(PROLOG);document.getElementById("copy-code").textContent="Copied!";});
function parseQuery(q){
 const m=q.trim().match(/^check_eligibility\(\s*(coding|robotics|literary|eco)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(programming|electronics|writing|environment)\s*,\s*([A-Z_]\w*)\s*,\s*([A-Z_]\w*)\s*\)\.?$/i);
 if(!m)return null;
 return {club:m[1].toLowerCase(),gpa:Number(m[2]),attendance:Number(m[3]),interest:m[4].toLowerCase(),resultVar:m[5],reasonsVar:m[6]};
}
document.getElementById("run-query").addEventListener("click",()=>{
 const q=document.getElementById("query").value,p=parseQuery(q),out=document.getElementById("query-output");
 if(!p){out.textContent="Query format not recognised. Use: check_eligibility(coding, 8.5, 90, programming, Result, Reasons).";return;}
 const r=evaluate(p.club,p.gpa,p.attendance,p.interest),result=r.eligible?"eligible":"not_eligible";
 const reasons=r.reasons.map(x=>"'"+x+"'").join(", ");
 out.textContent=`${p.resultVar} = ${result},\n${p.reasonsVar} = [${reasons}].`;
});
