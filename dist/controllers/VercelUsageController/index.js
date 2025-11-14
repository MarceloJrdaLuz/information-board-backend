"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const api_errors_1 = require("../../helpers/api-errors");
class VercelUsageController {
    async getUsage(req, res) {
        const { from, to, type } = req.query;
        const token = config_1.config.vercel_token;
        if (!token) {
            throw new api_errors_1.BadRequestError("Vercel token not configured in server");
        }
        if (!from || !to) {
            throw new api_errors_1.BadRequestError("Missing 'from' and 'to' query params");
        }
        const usageType = type || "requests"; // default
        // chamada para API da vercel
        const response = await fetch(`https://api.vercel.com/v2/usage?type=${usageType}&granularity=day&from=${from}&to=${to}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!(data === null || data === void 0 ? void 0 : data.data)) {
            throw new api_errors_1.BadRequestError("Failed to fetch Vercel usage");
        }
        // total de invocações
        const total = data.data.reduce((sum, day) => {
            return (sum +
                (day.function_invocation_successful_count || 0) +
                (day.function_invocation_error_count || 0));
        }, 0);
        const percent = ((total / 100000) * 100).toFixed(2);
        // breakdown por projeto
        const breakdown = data.data
            .flatMap((d) => d.breakdown.function_invocations)
            .filter(Boolean);
        const totals = {};
        for (const item of breakdown) {
            if (!item.name)
                continue;
            totals[item.name] = (totals[item.name] || 0) + item.percent;
        }
        const breakdownFormatted = Object.entries(totals).map(([name, pct]) => ({
            name,
            percent: (pct / data.data.length).toFixed(1),
        }));
        const daily = data.data.map((day) => {
            const dateStr = day.period_start ||
                day.start ||
                day.date ||
                day.timestamp ||
                null;
            return {
                date: dateStr ? dateStr.substring(0, 10) : "N/A",
                total: (day.function_invocation_successful_count || 0) +
                    (day.function_invocation_error_count || 0)
            };
        });
        return res.status(200).json({
            total_invocations: total,
            percent_used: percent,
            limit: 100000,
            breakdown: breakdownFormatted,
            daily
        });
    }
}
exports.default = new VercelUsageController();
