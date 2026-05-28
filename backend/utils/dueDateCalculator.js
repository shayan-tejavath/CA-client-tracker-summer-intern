export const calculateDueDate = (startDate, days) => {
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
};

