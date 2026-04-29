//@ts-check

import Blacklist from "./models/sqlBlacklist.js";
import ModLogs from "./models/sqlModLogs.js";
import Mutes from "./models/sqlMutes.js";
import ReportLogs from "./models/sqlReportLogs.js";
import ReportReplies from "./models/sqlReportReplies.js";

ReportLogs.hasMany(ReportReplies, {
  foreignKey: "reportId",
  as: "replies",
});

ReportReplies.belongsTo(ReportLogs, {
  foreignKey: "reportId",
});

export { Blacklist, ModLogs, Mutes, ReportLogs, ReportReplies };
