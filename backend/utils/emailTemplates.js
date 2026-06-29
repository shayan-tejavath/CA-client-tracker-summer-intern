const welcomeEmail = (name) => ({
  subject: "Welcome to QwikCA",
  body: `
Hello ${name},

Welcome to QwikCA.

Your account has been created successfully.

Thanks,
QwikCA Team
`,
});

const taskAssignedEmail = (
  name,
  taskName
) => ({
  subject: "New Task Assigned",
  body: `
Hello ${name},

A new task has been assigned.

Task:
${taskName}

Please login and review.

Thanks,
QwikCA Team
`,
});

module.exports = {
  welcomeEmail,
  taskAssignedEmail,
};