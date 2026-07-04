import WorkflowTemplate from "../../models/WorkflowTemplate.js";
import Service from "../../models/Service.js";
import Task from "../../models/Task.js";

export const generateTasksFromTemplate = async ({
  clientId,
  serviceId,
  templateId,
  assignedTo,
  assignedUsers = [],
}) => {
  const resolvedAssignedTo = assignedTo || assignedUsers.find(Boolean) || null;
  const fallbackDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const createdTasks = [];

  if (!clientId || !serviceId) {
    return createdTasks;
  }

  let template = null;

  if (templateId) {
    template = await WorkflowTemplate.findById(templateId).lean();
  }

  // If no explicit templateId provided or the provided template doesn't belong to the service,
  // prefer the service's configured `workflowTemplate` reference. Fall back to the first active
  // template for the service if none is configured.
  if (!template || String(template.service) !== String(serviceId)) {
    const service = await Service.findById(serviceId).lean();

    if (service && service.workflowTemplate) {
      const svcTpl = await WorkflowTemplate.findById(service.workflowTemplate).lean();
      if (svcTpl && String(svcTpl.service) === String(serviceId) && svcTpl.isActive) {
        template = svcTpl;
      }
    }

    if (!template) {
      template = await WorkflowTemplate.findOne({
        service: serviceId,
        isActive: true,
      }).lean();
    }
  }

  if (!template || !template.isActive) {
    return createdTasks;
  }

  const taskDefinitions = (template.taskDefinitions || [])
    .slice()
    .sort((a, b) => a.order - b.order);

  for (const definition of taskDefinitions) {
    const existingTask = await Task.findOne({
      client: clientId,
      service: serviceId,
      title: definition.title,
    });

    if (existingTask) {
      createdTasks.push(existingTask);
      continue;
    }

    const task = await Task.create({
      title: definition.title,
      description: `Auto-generated from workflow template: ${template.name}`,
      client: clientId,
      service: serviceId,
      assignedTo: resolvedAssignedTo,
      status: "Pending",
      priority: "Medium",
      dueDate: fallbackDueDate,
      recurrence: "None",
    });

    createdTasks.push(task);
  }

  return createdTasks;
};
