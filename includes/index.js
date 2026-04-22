//@ts-check

import Blacklist from "./sqlBlacklist.js";
import ModLogs from "./sqlModLogs.js";
import Mutes from "./sqlMutes.js";
import ReportLogs from "./sqlReportLogs.js";
import ReportReplies from "./sqlReportReplies.js";

ReportLogs.hasMany(ReportReplies, {
  foreignKey: "reportId",
  as: "replies",
});

ReportReplies.belongsTo(ReportLogs, {
  foreignKey: "reportId",
});

export { Blacklist, ModLogs, Mutes, ReportLogs, ReportReplies };
