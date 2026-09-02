/**
 * deliverableSchedulingService.js
 * Intelligent Date Distribution & Scheduling Service for Agency Deliverables.
 */

class DeliverableSchedulingService {
  /**
   * Generates calculated due dates for a package's deliverables across the target month.
   */
  generateScheduleDates({ deliverables = [], month = new Date().getMonth() + 1, year = new Date().getFullYear() }) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const scheduledItems = [];

    // Helper to skip Sundays and shift to next Monday
    const adjustForWorkingDay = (dateObj) => {
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0) {
        // Sunday -> shift to Monday (+1 day)
        dateObj.setDate(dateObj.getDate() + 1);
      }
      return dateObj;
    };

    for (const d of deliverables) {
      const quantity = Math.max(1, Number(d.quantity) || 1);
      const strategy = d.schedulingStrategy || "DISTRIBUTE_MONTH";

      for (let i = 0; i < quantity; i++) {
        let targetDay = 1;

        if (strategy === "MONTH_START") {
          targetDay = Math.min(daysInMonth, 2 + i * 2);
        } else if (strategy === "MONTH_END") {
          targetDay = Math.max(1, daysInMonth - (quantity - 1 - i));
        } else if (strategy === "WEEKLY") {
          // Spread 1 per week (Days 7, 14, 21, 28)
          const weekInterval = Math.floor(daysInMonth / quantity);
          targetDay = Math.min(daysInMonth, (i + 1) * weekInterval);
        } else {
          // DISTRIBUTE_MONTH: Spread evenly across working days (Days 2 to 28)
          const step = Math.max(1, Math.floor((daysInMonth - 4) / quantity));
          targetDay = Math.min(daysInMonth, 2 + i * step);
        }

        const dueDate = new Date(year, month - 1, targetDay, 18, 0, 0); // 6:00 PM due time
        adjustForWorkingDay(dueDate);

        scheduledItems.push({
          type: d.type,
          title: quantity > 1 ? `${d.title} #${i + 1}` : d.title,
          preferredRole: d.preferredRole || "Graphic Designer",
          slaHours: d.slaHours || 48,
          requiresApproval: d.requiresApproval !== false,
          schedulingStrategy: strategy,
          dueDate,
          index: i + 1,
          totalOfType: quantity,
        });
      }
    }

    // Sort all scheduled deliverables chronologically
    scheduledItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return scheduledItems;
  }
}

module.exports = new DeliverableSchedulingService();
