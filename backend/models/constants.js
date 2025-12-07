export const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  PAID: 'PAID',
  DISPUTED: 'DISPUTED',
  REFUNDED: 'REFUNDED'
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

export const USER_ROLES = {
  STUDENT: 'student',
  WRITER: 'writer',
  ADMIN: 'admin'
};

export const FILE_TYPES = {
  ASSIGNMENT: 'assignment',
  SUBMISSION: 'submission',
  AVATAR: 'avatar',
  DOCUMENT: 'document'
};

export const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'NEW_MESSAGE',
  NEW_AGREEMENT: 'NEW_AGREEMENT',
  AGREEMENT_ACCEPTED: 'AGREEMENT_ACCEPTED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  FILE_UPLOADED: 'FILE_UPLOADED'
};

export const WRITER_SPECIALTIES = {
  THESIS: 'Thesis Writing',
  RESEARCH: 'Research Papers',
  ESSAY: 'Essays',
  REVIEW: 'Literature Reviews',
  STEM: 'STEM Papers',
  BUSINESS: 'Business & Economics',
  LAW: 'Law & Legal Studies'
};

export const CITATION_STYLES = {
  APA: 'APA',
  MLA: 'MLA',
  CHICAGO: 'Chicago',
  HARVARD: 'Harvard',
  IEEE: 'IEEE',
  VANCOUVER: 'Vancouver'
};