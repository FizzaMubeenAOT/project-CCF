'use strict';

/**
 * @module controllers/studentController
 * Handles all student business logic.
 * Routes are thin wrappers that call these functions.
 * This separation makes unit-testing possible without spinning up Express.
 */

const Student   = require('../models/Student');
const AuditLog  = require('../models/AuditLog');
const { DEPARTMENTS } = require('../models/Student');
const { paginate } = require('../utils/paginate');

/* ── helpers ─────────────────────────────────────────────────────────────────── */

/** Extracts safe student fields from req.body — never trust raw input. */
function pickFields(body) {
  return {
    studentId:  body.studentId,
    firstName:  body.firstName,
    lastName:   body.lastName,
    email:      body.email,
    phone:      body.phone   || '',
    department: body.department,
    semester:   body.semester,
    cgpa:       body.cgpa !== '' ? body.cgpa : null,
    status:     body.status,
    gender:     body.gender  || 'prefer_not',
    dob:        body.dob     || null,
    address:    body.address || '',
    guardian:   body.guardian|| '',
    notes:      body.notes   || '',
  };
}

/* ── Controller methods ───────────────────────────────────────────────────────── */

exports.index = async (req, res) => {
  const { search, dept, status, semester, sort = '-createdAt', minCgpa, maxCgpa } = req.query;
  const filter = Student.buildFilter({ search, dept, status, semester, minCgpa, maxCgpa });

  const total    = await Student.countDocuments(filter);
  const pager    = paginate(req.query, total);
  const students = await Student.find(filter)
    .sort(sort)
    .skip(pager.skip)
    .limit(pager.perPage)
    .lean();

  res.render('students/index', { students, pager, DEPARTMENTS, query: req.query, title: 'Students' });
};

exports.newForm = (_req, res) => {
  res.render('students/form', { student: null, error: null, DEPARTMENTS, title: 'Add Student' });
};

exports.create = async (req, res) => {
  const data = pickFields(req.body);
  const student = await Student.create({ ...data, createdBy: req.session.userId });

  // Write audit log (non-blocking — we don't await)
  AuditLog.log({
    action:      'CREATE',
    collection:  'students',
    documentId:  student._id,
    performedBy: req.session.userId,
    username:    req.session.username,
    diff:        data,
    ip:          req.ip,
  }).catch(console.error);

  req.session.flash = { type: 'success', message: `${student.fullName} enrolled successfully.` };
  res.redirect('/students');
};

exports.detail = async (req, res) => {
  const [student, history] = await Promise.all([
    Student.findById(req.params.id).populate('createdBy', 'username').lean({ virtuals: true }),
    AuditLog.find({ documentId: req.params.id }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  if (!student) return res.redirect('/students');
  res.render('students/detail', { student, history, title: `${student.firstName} ${student.lastName}` });
};

exports.editForm = async (req, res) => {
  const student = await Student.findById(req.params.id).lean({ virtuals: true });
  if (!student) return res.redirect('/students');
  res.render('students/form', { student, error: null, DEPARTMENTS, title: 'Edit Student' });
};

exports.update = async (req, res) => {
  const before  = await Student.findById(req.params.id).lean();
  const data    = pickFields(req.body);
  const updated = await Student.findByIdAndUpdate(req.params.id, data, { runValidators: true, new: true });

  AuditLog.log({
    action:      'UPDATE',
    collection:  'students',
    documentId:  updated._id,
    performedBy: req.session.userId,
    username:    req.session.username,
    diff:        { before, after: data },
    ip:          req.ip,
  }).catch(console.error);

  req.session.flash = { type: 'success', message: 'Student record updated.' };
  res.redirect(`/students/${req.params.id}`);
};

exports.destroy = async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (student) {
    AuditLog.log({
      action:      'DELETE',
      collection:  'students',
      documentId:  student._id,
      performedBy: req.session.userId,
      username:    req.session.username,
      diff:        student.toObject(),
      ip:          req.ip,
    }).catch(console.error);
  }
  req.session.flash = { type: 'info', message: 'Student record deleted.' };
  res.redirect('/students');
};
