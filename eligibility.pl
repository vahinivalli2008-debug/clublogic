% CAMPUS CLUB MEMBERSHIP ELIGIBILITY REASONER

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
    Interest \= Required.

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
    ).
