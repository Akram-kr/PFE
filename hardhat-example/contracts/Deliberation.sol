// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract PFEDeliberation is AccessControl {

    // =========================================================================
    // Constants & Thresholds
    // =========================================================================
    uint8  public constant JURY_SIZE        = 4;

    uint16 public constant MAX_RAPPORT      = 500;   //  5.00 pts
    uint16 public constant MAX_CONCEPTION   = 400;   //  4.00 pts
    uint16 public constant MAX_APPLICATION  = 500;   //  5.00 pts
    uint16 public constant MAX_PRESENTATION = 300;   //  3.00 pts
    uint16 public constant MAX_QA           = 300;   //  3.00 pts
    uint16 public constant MAX_TOTAL        = 2000;  // 20.00 pts

    uint16 public constant MENTION_TB       = 1600;  // >= 16.00
    uint16 public constant MENTION_B        = 1400;  // >= 14.00
    uint16 public constant MENTION_AB       = 1200;  // >= 12.00
    uint16 public constant MENTION_P        = 1000;  // >= 10.00

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // =========================================================================
    // Enums
    // =========================================================================
    enum JuryRole { President, Promoteur, Examinateur1, Examinateur2 }
    enum SessionState { Open, Calculated, Cancelled }
    enum Mention { Insuffisant, Passable, AssezBien, Bien, TresBien }

    // =========================================================================
    // Structs (Fix for Stack Too Deep)
    // =========================================================================
    
    // Grouping Student details
    struct StudentInfo {
        string matricule;
        string name;
        string pfeTitle;
        string specialty;
        string academicYear;
    }

    // Grouping Jury addresses
    struct JuryInfo {
        address president;
        address promoteur;
        address examinateur1;
        address examinateur2;
    }

    struct GradeBreakdown {
        uint16 rapport;      
        uint16 conception;   
        uint16 application;  
        uint16 presentation; 
        uint16 qa;           
        uint16 total;        
        uint256 submittedAt;
    }

    struct Session {
        uint256 sessionId;
        StudentInfo student;
        JuryInfo jury;

        uint8 voteCount;
        bool presidentVoted;
        bool promoteurVoted;
        bool examinateur1Voted;
        bool examinateur2Voted;

        GradeBreakdown presidentGrades;
        GradeBreakdown promoteurGrades;
        GradeBreakdown examinateur1Grades;
        GradeBreakdown examinateur2Grades;

        uint16 finalAverage;
        Mention mention;
        bool isCalculated;
        SessionState state;

        uint256 createdAt;
        uint256 calculatedAt;
        string cancelReason;
        address createdBy;
    }

    // =========================================================================
    // State Variables
    // =========================================================================
    uint256 private _sessionCounter;
    mapping(uint256 => Session) private _sessions;
    mapping(bytes32 => bool)    private _sessionExists;
    mapping(bytes32 => uint256) private _sessionByStudent;
    mapping(address => uint256[]) private _professorSessions;

    // =========================================================================
    // Events & Errors
    // =========================================================================
    event SessionInitialized(uint256 indexed sessionId, string matricule, address president, uint256 createdAt);
    event GradeSubmitted(uint256 indexed sessionId, address indexed professor, JuryRole juryRole, uint16 total);
    event SessionCalculated(uint256 indexed sessionId, string matricule, uint16 finalAverage, Mention mention);
    event SessionCancelled(uint256 indexed sessionId, address indexed cancelledBy, string reason);

    error Session_AlreadyExists();
    error Session_NotFound();
    error Session_NotOpen();
    error Session_AlreadyCalculated();
    error Session_InvalidJury();
    error Session_MissingData();
    error Session_InvalidForAcademicYear();
    error Grade_NotJuryMember();
    error Grade_AlreadySubmitted();
    error Grade_ExceedsMax();
    error Cancel_InvalidState();

    // =========================================================================
    // Constructor
    // =========================================================================
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function addAdmin(address addr) external onlyRole(ADMIN_ROLE) {
        _grantRole(ADMIN_ROLE, addr);
    }

    // =========================================================================
    // Admin: Initialize Session (Using Structs to prevent Stack Too Deep)
    // =========================================================================
    function initializeSession(
        StudentInfo calldata student,
        JuryInfo calldata jury
    ) external onlyRole(ADMIN_ROLE) returns (uint256 sessionId) {

        if (bytes(student.matricule).length == 0 || bytes(student.name).length == 0) revert Session_MissingData();
        if (jury.president == address(0) || jury.promoteur == address(0) || jury.examinateur1 == address(0) || jury.examinateur2 == address(0)) revert Session_InvalidJury();

        // Ensure distinct jury members
        if (jury.president == jury.promoteur || jury.president == jury.examinateur1 || jury.president == jury.examinateur2 || jury.promoteur == jury.examinateur1 || jury.promoteur == jury.examinateur2 || jury.examinateur1 == jury.examinateur2) {
            revert Session_InvalidJury();
        }
        // ensure the acadimic year is L3 or M2
        if (keccak256(abi.encodePacked(student.academicYear)) != keccak256(abi.encodePacked("L3")) && keccak256(abi.encodePacked(student.academicYear)) != keccak256(abi.encodePacked("M2"))) {
            revert Session_InvalidForAcademicYear();
        }
        // ensure the student doesn't already have a session for the same academic year
        bytes32 key = keccak256(abi.encodePacked(student.matricule, student.academicYear));
        
        if (_sessionExists[key]) revert Session_AlreadyExists();

        sessionId = _sessionCounter++;
        Session storage s = _sessions[sessionId];
        
        s.sessionId = sessionId;
        s.student = student;
        s.jury = jury;
        s.state = SessionState.Open;
        s.createdAt = block.timestamp;
        s.createdBy = msg.sender;

        _sessionExists[key] = true;
        _sessionByStudent[key] = sessionId;

        _professorSessions[jury.president].push(sessionId);
        _professorSessions[jury.promoteur].push(sessionId);
        _professorSessions[jury.examinateur1].push(sessionId);
        _professorSessions[jury.examinateur2].push(sessionId);

        emit SessionInitialized(sessionId, student.matricule, jury.president, block.timestamp);
    }

    // =========================================================================
    // Jury: Submit Grades
    // =========================================================================
    function submitGrade(
        uint256 sessionId, uint16 rapport, uint16 conception, uint16 application, uint16 presentation, uint16 qa
    ) external {
        if (sessionId >= _sessionCounter) revert Session_NotFound();
        Session storage s = _sessions[sessionId];
        
        
        
        if (s.state != SessionState.Open) revert Session_NotOpen();
        if (s.isCalculated) revert Session_AlreadyCalculated();

        JuryRole role;
        bool isJury = false;

        if (msg.sender == s.jury.president) {
            if (s.presidentVoted) revert Grade_AlreadySubmitted();
            role = JuryRole.President; isJury = true;
        } else if (msg.sender == s.jury.promoteur) {
            if (s.promoteurVoted) revert Grade_AlreadySubmitted();
            role = JuryRole.Promoteur; isJury = true;
        } else if (msg.sender == s.jury.examinateur1) {
            if (s.examinateur1Voted) revert Grade_AlreadySubmitted();
            role = JuryRole.Examinateur1; isJury = true;
        } else if (msg.sender == s.jury.examinateur2) {
            if (s.examinateur2Voted) revert Grade_AlreadySubmitted();
            role = JuryRole.Examinateur2; isJury = true;
        }

        if (!isJury) revert Grade_NotJuryMember();

        if (rapport > MAX_RAPPORT || conception > MAX_CONCEPTION || application > MAX_APPLICATION || presentation > MAX_PRESENTATION || qa > MAX_QA) {
            revert Grade_ExceedsMax();
        }

        uint16 total = rapport + conception + application + presentation + qa;
        GradeBreakdown memory grade = GradeBreakdown(rapport, conception, application, presentation, qa, total, block.timestamp);

        if (role == JuryRole.President) { s.presidentGrades = grade; s.presidentVoted = true; } 
        else if (role == JuryRole.Promoteur) { s.promoteurGrades = grade; s.promoteurVoted = true; } 
        else if (role == JuryRole.Examinateur1) { s.examinateur1Grades = grade; s.examinateur1Voted = true; } 
        else { s.examinateur2Grades = grade; s.examinateur2Voted = true; }

        s.voteCount += 1;
        emit GradeSubmitted(sessionId, msg.sender, role, total);

        if (s.voteCount == JURY_SIZE) {
            _finalizeSession(sessionId);
        }
    }

    // =========================================================================
    // Internal: Finalize Math Logic
    // =========================================================================
    function _finalizeSession(uint256 sessionId) internal {
        Session storage s = _sessions[sessionId];

        uint256 totalPool = 
            uint256(s.presidentGrades.total) +
            uint256(s.promoteurGrades.total) +
            uint256(s.examinateur1Grades.total) +
            uint256(s.examinateur2Grades.total);

        uint16 finalAverage = uint16(totalPool / JURY_SIZE);

        Mention mention = Mention.Insuffisant;
        if (finalAverage >= MENTION_TB) mention = Mention.TresBien;
        else if (finalAverage >= MENTION_B) mention = Mention.Bien;
        else if (finalAverage >= MENTION_AB) mention = Mention.AssezBien;
        else if (finalAverage >= MENTION_P) mention = Mention.Passable;

        s.finalAverage = finalAverage;
        s.mention = mention;
        s.isCalculated = true;
        s.state = SessionState.Calculated;
        s.calculatedAt = block.timestamp;

        emit SessionCalculated(sessionId, s.student.matricule, finalAverage, mention);
    }

    // =========================================================================
    // Splitting Getters (Fix for Stack Too Deep)
    // =========================================================================

    function getStudentInfo(uint256 sessionId) external view returns (StudentInfo memory) {
        if (sessionId >= _sessionCounter) revert Session_NotFound();
        return _sessions[sessionId].student;
    }

    function getJuryInfo(uint256 sessionId) external view returns (JuryInfo memory) {
        if (sessionId >= _sessionCounter) revert Session_NotFound();
        return _sessions[sessionId].jury;
    }

    function getSessionStatus(uint256 sessionId) external view returns (
        uint8 voteCount, bool isCalculated, uint16 finalAverage, string memory mentionLabel, SessionState state
    ) {
        if (sessionId >= _sessionCounter) revert Session_NotFound();
        Session storage s = _sessions[sessionId];
        return (s.voteCount, s.isCalculated, s.finalAverage, _mentionLabel(s.mention), s.state);
    }

    function getFinalGrade(uint256 sessionId) external view returns (
        bool isCalculated, string memory studentId, uint16 finalNote, string memory mentionLabel
    ) {
        if (sessionId >= _sessionCounter) revert Session_NotFound();
        Session storage s = _sessions[sessionId];
        return (s.isCalculated, s.student.matricule, s.finalAverage, _mentionLabel(s.mention));
    }

    // =========================================================================
    // Helpers
    // =========================================================================
    function _mentionLabel(Mention m) internal pure returns (string memory) {
        if (m == Mention.TresBien) return "Tres Bien";
        if (m == Mention.Bien) return "Bien";
        if (m == Mention.AssezBien) return "Assez Bien";
        if (m == Mention.Passable) return "Passable";
        return "Insuffisant";
    }

    function cancelSession(uint256 sessionId, string calldata reason) external onlyRole(ADMIN_ROLE) {
        if (sessionId >= _sessionCounter) revert Session_NotFound();
        Session storage s = _sessions[sessionId];
        if (s.isCalculated) revert Cancel_InvalidState();

        s.state = SessionState.Cancelled;
        s.cancelReason = reason;
        
        bytes32 key = keccak256(abi.encodePacked(s.student.matricule, s.student.academicYear));
        _sessionExists[key] = false;

        emit SessionCancelled(sessionId, msg.sender, reason);
    }
}