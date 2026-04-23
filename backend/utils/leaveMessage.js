export const buildLeaveMessage = ({
  name,
  role,           // "Student" | "Staff"
  department,
  year,           // optional (students)
  status,
  reason,
  fromDate,
  toDate,
}) => {
  const decision =
    status === "Approved" ? "APPROVED ✅" : "REJECTED ❌";

  return `Dear ${name},

Your leave request has been ${decision} by the Head of Department.

━━━━━━━━━━━━━━━━━━━━
👤 Role        : ${role}
🏫 Department  : ${department}
${year ? `🎓 Year        : ${year}` : ""}
📝 Reason      : ${reason}
📅 Duration    : ${new Date(fromDate).toLocaleDateString("en-IN")}
               to ${new Date(toDate).toLocaleDateString("en-IN")}
━━━━━━━━━━━━━━━━━━━━

If you have any queries, please contact your department office.

Regards,
Leave Management System`;
};
