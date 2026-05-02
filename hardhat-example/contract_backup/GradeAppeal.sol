// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GradeAppeal
 * @notice On-chain grade appeal system (Recours / Demande de Révision de Note)
 * @dev    Uniquely solves a real Algerian university problem:
 *         Students currently fill paper forms and wait weeks with no visibility.
 *         This contract makes the entire process transparent, timestamped,
 *         and immutable — every decision is permanently on-chain.
 *
 *         Appeal lifecycle:
 *         SUBMITTED → UNDER_REVIEW → (ACCEPTED | REJECTED | ESCALATED)
 *
 *         Actors:
 *         - Student: submits appeal with justification
 *         - Professor: responds within deadline
 *         - Department Head: final decision if professor rejects
 *         - GraduationEligibility: automatically unblocked when resolved
 */
contract GradeAppeal {

    // ── Appeal states ──────────────────────────────────────────────────────

    enum AppealStatus {
        SUBMITTED,       // Student submitted — awaiting professor response
        UNDER_REVIEW,    // Professor acknowledged — reviewing
        ACCEPTED,        // Grade revised upward — resolved
        REJECTED,        // Professor maintains grade — closed
        ESCALATED,       // Escalated to Department Head
        DEPT_ACCEPTED,   // Department Head accepted — grade revised
        DEPT_REJECTED,   // Department Head rejected — final decision
        WITHDRAWN        // Student withdrew the appeal
    }

    enum AppealReason {
        CALCULATION_ERROR,    // Erreur de calcul
        MISSING_COPY,         // Copie non corrigée / manquante
        COPY_MIXUP,           // Confusion de copies
        PARTIAL_CORRECTION,   // Correction partielle
        UNJUSTIFIED_PENALTY,  // Pénalité injustifiée
        OTHER                 // Autre raison
    }

    // ── Appeal struct ──────────────────────────────────────────────────────

    struct Appeal {
        uint256     appealId;
        address     studentWallet;
        string      matricule;
        string      studentName;
        string      moduleCode;
        string      moduleName;
        string      semester;
        string      academicYear;
        uint8       currentGrade;     // Grade being contested /20
        uint8       requestedGrade;   // Grade student believes is correct /20
        AppealReason reason;
        string      justification;    // Detailed explanation
        string      evidenceCID;      // IPFS CID of supporting documents (optional)

        address     professor;        // Professor wallet
        string      professorResponse;// Professor's written response
        uint8       revisedGrade;     // New grade if accepted (0 = unchanged)

        address     deptHead;         // Department Head wallet
        string      deptHeadDecision; // Final decision justification

        AppealStatus status;
        uint256     submittedAt;
        uint256     professorDeadline;// Professor must respond within 7 days
        uint256     resolvedAt;

        bool        gradeUpdated;     // Whether grade was actually changed
    }

    // ── State variables ────────────────────────────────────────────────────

    uint256 private _appealCounter;

    // appealId => Appeal
    mapping(uint256 => Appeal) public appeals;

    // studentWallet => list of appeal IDs
    mapping(address => uint256[]) public studentAppeals;

    // moduleCode+semester+year+studentWallet => appealId (prevent duplicates)
    mapping(bytes32 => uint256) public existingAppeal;
    mapping(bytes32 => bool)    public hasActiveAppeal;

    // Professor wallet => list of appeal IDs assigned to them
    mapping(address => uint256[]) public professorAppeals;

    // Department Head wallet => authorized
    mapping(address => bool) public departmentHeads;

    // Authorized professors
    mapping(address => bool) public authorizedProfessors;

    // GraduationEligibility contract address — to unblock student when resolved
    address public eligibilityContract;
    address public admin;

    uint256 public constant PROFESSOR_DEADLINE = 7 days;
    uint256 public constant ESCALATION_DEADLINE = 3 days;

    // ── Events ─────────────────────────────────────────────────────────────

    event AppealSubmitted(
        uint256 indexed appealId,
        address indexed student,
        string  moduleCode,
        uint8   currentGrade,
        uint256 deadline
    );
    event AppealAcknowledged(
        uint256 indexed appealId,
        address indexed professor
    );
    event AppealResolved(
        uint256 indexed appealId,
        AppealStatus status,
        uint8   newGrade,
        bool    gradeChanged
    );
    event AppealEscalated(
        uint256 indexed appealId,
        address indexed deptHead,
        uint256 escalatedAt
    );
    event AppealWithdrawn(
        uint256 indexed appealId,
        address indexed student
    );
    event DeadlineBreached(
        uint256 indexed appealId,
        address indexed professor,
        uint256 breachedAt
    );

    // ── Modifiers ──────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    modifier onlyProfessor() {
        require(authorizedProfessors[msg.sender], "Not an authorized professor");
        _;
    }

    modifier onlyDeptHead() {
        require(departmentHeads[msg.sender], "Not a department head");
        _;
    }

    modifier appealExists(uint256 appealId) {
        require(appealId < _appealCounter, "Appeal does not exist");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────

    constructor(address _eligibilityContract) {
        admin               = msg.sender;
        eligibilityContract = _eligibilityContract;
        departmentHeads[msg.sender]     = true;
        authorizedProfessors[msg.sender] = true;
    }

    function addProfessor(address prof) public onlyAdmin {
        authorizedProfessors[prof] = true;
    }

    function addDeptHead(address head) public onlyAdmin {
        departmentHeads[head] = true;
    }

    // ── STEP 1: Student submits appeal ─────────────────────────────────────

    /**
     * @notice Student submits a grade appeal
     * @dev    One appeal per module per semester per year
     *         Blocks graduation eligibility until resolved
     */
    function submitAppeal(
        string memory matricule,
        string memory studentName,
        string memory moduleCode,
        string memory moduleName,
        string memory semester,
        string memory academicYear,
        uint8  currentGrade,
        uint8  requestedGrade,
        AppealReason reason,
        string memory justification,
        string memory evidenceCID,   // optional IPFS CID
        address professor
    ) public returns (uint256) {
        require(currentGrade <= 20 && requestedGrade <= 20, "Invalid grade");
        require(requestedGrade > currentGrade, "Requested grade must be higher");
        require(bytes(justification).length >= 20, "Justification too short");
        require(authorizedProfessors[professor], "Invalid professor address");

        // Prevent duplicate active appeals for same module
        bytes32 key = keccak256(abi.encodePacked(
            msg.sender, moduleCode, semester, academicYear
        ));
        require(!hasActiveAppeal[key], "Active appeal already exists for this module");

        uint256 appealId = _appealCounter++;

        appeals[appealId] = Appeal({
            appealId:          appealId,
            studentWallet:     msg.sender,
            matricule:         matricule,
            studentName:       studentName,
            moduleCode:        moduleCode,
            moduleName:        moduleName,
            semester:          semester,
            academicYear:      academicYear,
            currentGrade:      currentGrade,
            requestedGrade:    requestedGrade,
            reason:            reason,
            justification:     justification,
            evidenceCID:       evidenceCID,
            professor:         professor,
            professorResponse: "",
            revisedGrade:      0,
            deptHead:          address(0),
            deptHeadDecision:  "",
            status:            AppealStatus.SUBMITTED,
            submittedAt:       block.timestamp,
            professorDeadline: block.timestamp + PROFESSOR_DEADLINE,
            resolvedAt:        0,
            gradeUpdated:      false
        });

        studentAppeals[msg.sender].push(appealId);
        professorAppeals[professor].push(appealId);
        existingAppeal[key]  = appealId;
        hasActiveAppeal[key] = true;

        // Block graduation eligibility
        _blockGraduation(msg.sender, true);

        emit AppealSubmitted(
            appealId, msg.sender, moduleCode,
            currentGrade, block.timestamp + PROFESSOR_DEADLINE
        );

        return appealId;
    }

    // ── STEP 2: Professor acknowledges ────────────────────────────────────

    function acknowledgeAppeal(uint256 appealId)
        public onlyProfessor appealExists(appealId)
    {
        Appeal storage a = appeals[appealId];
        require(a.professor == msg.sender, "Not assigned professor");
        require(a.status == AppealStatus.SUBMITTED, "Wrong status");

        a.status = AppealStatus.UNDER_REVIEW;
        emit AppealAcknowledged(appealId, msg.sender);
    }

    // ── STEP 3a: Professor accepts — grade revised ────────────────────────

    function acceptAppeal(
        uint256 appealId,
        uint8   newGrade,
        string memory response
    ) public onlyProfessor appealExists(appealId) {
        Appeal storage a = appeals[appealId];
        require(a.professor == msg.sender, "Not assigned professor");
        require(
            a.status == AppealStatus.SUBMITTED ||
            a.status == AppealStatus.UNDER_REVIEW,
            "Cannot respond in current status"
        );
        require(newGrade > a.currentGrade && newGrade <= 20, "Invalid revised grade");
        require(bytes(response).length > 0, "Response required");

        a.professorResponse = response;
        a.revisedGrade      = newGrade;
        a.status            = AppealStatus.ACCEPTED;
        a.resolvedAt        = block.timestamp;
        a.gradeUpdated      = true;

        // Unblock graduation eligibility
        _resolveKey(a);
        _blockGraduation(a.studentWallet, false);

        emit AppealResolved(appealId, AppealStatus.ACCEPTED, newGrade, true);
    }

    // ── STEP 3b: Professor rejects ────────────────────────────────────────

    function rejectAppeal(
        uint256 appealId,
        string memory response
    ) public onlyProfessor appealExists(appealId) {
        Appeal storage a = appeals[appealId];
        require(a.professor == msg.sender, "Not assigned professor");
        require(
            a.status == AppealStatus.SUBMITTED ||
            a.status == AppealStatus.UNDER_REVIEW,
            "Cannot respond in current status"
        );
        require(bytes(response).length >= 10, "Response too short");

        a.professorResponse = response;
        a.status            = AppealStatus.REJECTED;
        // Note: NOT resolved yet — student can escalate

        emit AppealResolved(appealId, AppealStatus.REJECTED, a.currentGrade, false);
    }

    // ── STEP 4: Student escalates to Department Head ──────────────────────

    function escalateToHead(
        uint256 appealId,
        address deptHead
    ) public appealExists(appealId) {
        Appeal storage a = appeals[appealId];
        require(a.studentWallet == msg.sender, "Not your appeal");
        require(a.status == AppealStatus.REJECTED, "Can only escalate rejected appeals");
        require(departmentHeads[deptHead], "Invalid department head address");

        // Can also escalate if professor missed deadline
        bool deadlineBreached = block.timestamp > a.professorDeadline &&
                                a.status == AppealStatus.SUBMITTED;
        if (deadlineBreached) {
            emit DeadlineBreached(appealId, a.professor, block.timestamp);
        }

        a.status   = AppealStatus.ESCALATED;
        a.deptHead = deptHead;

        emit AppealEscalated(appealId, deptHead, block.timestamp);
    }

    // ── STEP 5a: Department Head accepts ──────────────────────────────────

    function deptHeadAccept(
        uint256 appealId,
        uint8   finalGrade,
        string memory decision
    ) public onlyDeptHead appealExists(appealId) {
        Appeal storage a = appeals[appealId];
        require(a.deptHead == msg.sender, "Not assigned dept head");
        require(a.status == AppealStatus.ESCALATED, "Not escalated");
        require(finalGrade > a.currentGrade && finalGrade <= 20, "Invalid final grade");

        a.revisedGrade     = finalGrade;
        a.deptHeadDecision = decision;
        a.status           = AppealStatus.DEPT_ACCEPTED;
        a.resolvedAt       = block.timestamp;
        a.gradeUpdated     = true;

        _resolveKey(a);
        _blockGraduation(a.studentWallet, false);

        emit AppealResolved(appealId, AppealStatus.DEPT_ACCEPTED, finalGrade, true);
    }

    // ── STEP 5b: Department Head rejects — FINAL decision ─────────────────

    function deptHeadReject(
        uint256 appealId,
        string memory decision
    ) public onlyDeptHead appealExists(appealId) {
        Appeal storage a = appeals[appealId];
        require(a.deptHead == msg.sender, "Not assigned dept head");
        require(a.status == AppealStatus.ESCALATED, "Not escalated");
        require(bytes(decision).length >= 10, "Decision too short");

        a.deptHeadDecision = decision;
        a.status           = AppealStatus.DEPT_REJECTED;
        a.resolvedAt       = block.timestamp;
        a.gradeUpdated     = false;

        // Final decision — unblock graduation with original grade
        _resolveKey(a);
        _blockGraduation(a.studentWallet, false);

        emit AppealResolved(appealId, AppealStatus.DEPT_REJECTED, a.currentGrade, false);
    }

    // ── Student withdraws appeal ──────────────────────────────────────────

    function withdrawAppeal(uint256 appealId) public appealExists(appealId) {
        Appeal storage a = appeals[appealId];
        require(a.studentWallet == msg.sender, "Not your appeal");
        require(
            a.status == AppealStatus.SUBMITTED ||
            a.status == AppealStatus.UNDER_REVIEW,
            "Cannot withdraw at this stage"
        );

        a.status     = AppealStatus.WITHDRAWN;
        a.resolvedAt = block.timestamp;

        _resolveKey(a);
        _blockGraduation(msg.sender, false);

        emit AppealWithdrawn(appealId, msg.sender);
    }

    // ── Read functions ─────────────────────────────────────────────────────

    function getAppeal(uint256 appealId) public view returns (Appeal memory) {
        return appeals[appealId];
    }

    function getStudentAppeals(address student) public view returns (uint256[] memory) {
        return studentAppeals[student];
    }

    function getProfessorAppeals(address professor) public view returns (uint256[] memory) {
        return professorAppeals[professor];
    }

    function hasOpenAppeal(address student) public view returns (bool) {
        uint256[] memory ids = studentAppeals[student];
        for (uint256 i = 0; i < ids.length; i++) {
            AppealStatus s = appeals[ids[i]].status;
            if (s == AppealStatus.SUBMITTED ||
                s == AppealStatus.UNDER_REVIEW ||
                s == AppealStatus.REJECTED ||
                s == AppealStatus.ESCALATED) {
                return true;
            }
        }
        return false;
    }

    function isDeadlineBreached(uint256 appealId) public view returns (bool) {
        Appeal storage a = appeals[appealId];
        return block.timestamp > a.professorDeadline &&
               a.status == AppealStatus.SUBMITTED;
    }

    function getAppealStatusName(AppealStatus s) public pure returns (string memory) {
        if (s == AppealStatus.SUBMITTED)      return "Submitted";
        if (s == AppealStatus.UNDER_REVIEW)   return "Under Review";
        if (s == AppealStatus.ACCEPTED)       return "Accepted";
        if (s == AppealStatus.REJECTED)       return "Rejected";
        if (s == AppealStatus.ESCALATED)      return "Escalated to Dept Head";
        if (s == AppealStatus.DEPT_ACCEPTED)  return "Accepted by Dept Head";
        if (s == AppealStatus.DEPT_REJECTED)  return "Rejected by Dept Head (Final)";
        return "Withdrawn";
    }

    // ── Internal helpers ───────────────────────────────────────────────────

    function _resolveKey(Appeal storage a) internal {
        bytes32 key = keccak256(abi.encodePacked(
            a.studentWallet, a.moduleCode, a.semester, a.academicYear
        ));
        hasActiveAppeal[key] = false;
    }

    function _blockGraduation(address student, bool block_) internal {
        if (eligibilityContract == address(0)) return;
        // Call GraduationEligibility.setAppealStatus
        (bool success, ) = eligibilityContract.call(
            abi.encodeWithSignature(
                "setAppealStatus(address,bool)",
                student,
                block_
            )
        );
        // Silently ignore if call fails — don't block the appeal transaction
    }
}
