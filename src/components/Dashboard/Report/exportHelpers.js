import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"

function resolveTableFn() {
  const table =
    typeof autoTable === "function"
      ? autoTable
      : autoTable?.autoTable || autoTable?.default
  if (typeof table !== "function") {
    throw new Error("jspdf-autotable is not loaded")
  }
  return table
}

function resolvePDF() {
  return jsPDF?.jsPDF || jsPDF
}

function fmtDate(value) {
  if (!value) return "-"
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "-"
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "-"
  }
}

export const exportToCSV = (type = "full", stats, reportsData, filteredData) => {
  let headers, rows

  if (type === "company-summary") {
    headers = ["Company", "Total Tasks", "Persons", "Task Distribution"]
    rows = Object.entries(stats.companyPersonDistribution || {}).map(
      ([company, persons]) => {
        const total = stats.byCompany[company] || 0
        const personList = Object.entries(persons)
          .map(([person, count]) => `${person}(${count})`)
          .join(", ")
        return [`"${company}"`, total, Object.keys(persons).length, `"${personList}"`]
      }
    )
  } else if (type === "person-summary") {
    headers = ["Person", "Total Tasks", "Companies", "Task Details"]
    rows = Object.entries(stats.byPerson || {}).map(([person, count]) => {
      const companies = reportsData
        .filter(
          (task) =>
            task.employee_name_1 === person || task.team_member_name === person
        )
        .map((task) => task.party_name)
      const uniqueCompanies = [...new Set(companies)].join(", ")
      const taskNos = reportsData
        .filter(
          (task) =>
            task.employee_name_1 === person || task.team_member_name === person
        )
        .map((task) => task.task_no)
        .filter(Boolean)
        .join(", ")
      return [`"${person}"`, count, `"${uniqueCompanies}"`, `"${taskNos}"`]
    })
  } else {
    headers = [
      "Task No",
      "Company",
      "Person",
      "System",
      "Expected Date",
      "Given Date",
      "Status",
      "Priority",
    ]
    rows = (filteredData || []).map((task) => {
      const expected = task.expected_date_to_close || task.planned3 || ""
      return [
        `"${task.task_no || ""}"`,
        `"${task.party_name || ""}"`,
        `"${task.employee_name_1 || task.team_member_name || "Unassigned"}"`,
        `"${task.system_name || ""}"`,
        `"${expected}"`,
        `"${task.given_date ? new Date(task.given_date).toLocaleDateString() : ""}"`,
        `"${task.status || "Pending"}"`,
        `"${task.priority || task.priority_in_customer || "Medium"}"`,
      ]
    })
  }

  const csvRows = [headers.join(","), ...rows]
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `reports-${type}-${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export const exportToPDF = (stats, reportsData, dateRange, filteredData) => {
  try {
    const PDF = resolvePDF()
    const table = resolveTableFn()
    const doc = new PDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    const data =
      Array.isArray(filteredData) && filteredData.length
        ? filteredData
        : reportsData || []
    const now = new Date()
    const generatedAt = now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const dateText =
      dateRange?.startDate && dateRange?.endDate
        ? `${fmtDate(dateRange.startDate)} - ${fmtDate(dateRange.endDate)}`
        : "All time"

    let y = 16

    const ensureSpace = (need = 40) => {
      if (y + need > pageHeight - 16) {
        doc.addPage()
        y = 16
      }
    }

    const sectionTitle = (title) => {
      ensureSpace(18)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text(title, margin, y)
      y += 2
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.6)
      doc.line(margin, y, margin + 26, y)
      y += 5
    }

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageWidth, 40, "F")
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 40, pageWidth, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Task Distribution Report", margin, 16)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(191, 219, 254)
    doc.text("Admin report - company, person & deadline overview", margin, 24)
    doc.setTextColor(226, 232, 240)
    doc.text(`Generated: ${generatedAt}`, margin, 33)
    doc.text(`Period: ${dateText}`, pageWidth - margin, 33, { align: "right" })
    y = 52

    sectionTitle("1. Overview")
    table(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Total Pending", "Due Today", "Upcoming", "Overdue"]],
      body: [[
        String(stats.totalPending ?? data.length ?? 0),
        String(stats.todayTasks ?? 0),
        String(stats.upcomingTasks ?? 0),
        String(stats.overdueTasks ?? 0),
      ]],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, halign: "center" },
      bodyStyles: { fontSize: 11,halign: "center", fontStyle: "bold" },
      styles: { cellPadding: 3.5 },
    })
    y = (doc.lastAutoTable?.finalY || y) + 8

    sectionTitle("2. Task distribution by company")
    const companyData = Object.entries(stats.companyPersonDistribution || {})
      .sort(
        ([, a], [, b]) =>
          Object.values(b).reduce((s, v) => s + v, 0) -
          Object.values(a).reduce((s, v) => s + v, 0)
      )
      .map(([company, persons]) => {
        const totalTasks = stats.byCompany?.[company] || 0
        const personDistribution = Object.entries(persons)
          .map(([person, count]) => `${person}: ${count}`)
          .join(", ")
        return [
          company,
          String(totalTasks),
          String(Object.keys(persons).length),
          personDistribution,
        ]
      })

    table(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Company", "Tasks", "Persons", "Person distribution"]],
      body: companyData.length ? companyData : [["No company data", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      styles: { overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 18, halign: "center" },
        2: { cellWidth: 18,halign: "center" },
      },
    })
    y = (doc.lastAutoTable?.finalY || y) + 8

    sectionTitle("3. Task distribution by person")
    const personData = Object.entries(stats.byPerson || {})
      .sort(([, a], [, b]) => b - a)
      .map(([person, count]) => {
        const companies = data
          .filter(
            (task) =>
              task.employee_name_1 === person || task.team_member_name === person
          )
          .map((task) => task.party_name)
          .filter(Boolean)
        const uniqueCompanies = [...new Set(companies)].join(", ")
        return [person, String(count), uniqueCompanies || "-"]
      })

    table(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Person", "Tasks", "Companies"]],
      body: personData.length ? personData : [["No person data", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      styles: { overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 18,halign: "center" },
      },
    })
    y = (doc.lastAutoTable?.finalY || y) + 8

    doc.addPage()
    y = 16
    sectionTitle(`4. Task list (${data.length})`)
    const taskRows = data.map((task) => [
      String(task.task_no || "-"),
      String(task.party_name || "-").slice(0, 22),
      String(task.employee_name_1 || task.team_member_name || "Unassigned").slice(0, 18),
      String(task.system_name || "-").slice(0, 16),
      fmtDate(task.expected_date_to_close || task.planned3),
      fmtDate(task.given_date),
      String(task.status || "Pending"),
      String(task.priority || task.priority_in_customer || "Medium"),
    ])

    table(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Task #", "Company", "Person", "System", "Expected", "Given", "Status", "Priority"]],
      body: taskRows.length ? taskRows : [["-", "-", "-", "No tasks", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7 },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.3 },
      styles: { overflow: "linebreak" },
    })

    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Task Distribution Report  |  ${generatedAt}  |  Period: ${dateText}`,
        margin,
        pageHeight - 7
      )
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, {
        align: "right",
      })
    }

    doc.save(`reports-${new Date().toISOString().split("T")[0]}.pdf`)
  } catch (err) {
    console.error("Export PDF failed:", err)
    window.alert(`PDF export failed: ${err?.message || err}. Check browser console for details.`)
  }
}

export const exportCompanyDistributionPDF = (stats, reportsData, dateRange) => {
  try {
    const PDF = resolvePDF()
    const table = resolveTableFn()
    const doc = new PDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 14
    const data = reportsData || []
    const now = new Date()
    const generatedAt = now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const dateText =
      dateRange?.startDate && dateRange?.endDate
        ? `${fmtDate(dateRange.startDate)} - ${fmtDate(dateRange.endDate)}`
        : "All time"

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, pageWidth, 36, "F")
    doc.setFillColor(16, 185, 129)
    doc.rect(0, 36, pageWidth, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Task Distribution by Company", margin, 15)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(167, 243, 208)
    doc.text(`Generated: ${generatedAt}  |  Period: ${dateText}`, margin, 24)
    doc.setTextColor(226, 232, 240)
    doc.text(
      `Companies: ${Object.keys(stats.companyPersonDistribution || {}).length}  |  Tasks: ${stats.totalPending ?? data.length}`,
      margin,
      31
    )

    let y = 48

    const companyRows = Object.entries(stats.companyPersonDistribution || {})
      .sort(
        ([, a], [, b]) =>
          Object.values(b).reduce((s, v) => s + v, 0) -
          Object.values(a).reduce((s, v) => s + v, 0)
      )
      .map(([company, persons]) => {
        const totalTasks = stats.byCompany?.[company] || 0
        const personList = Object.entries(persons)
          .sort(([, a], [, b]) => b - a)
          .map(([person, count]) => `${person} (${count})`)
          .join(", ")
        return [company, String(totalTasks), String(Object.keys(persons).length), personList || "-"]
      })

    table(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Company", "Tasks", "Persons", "Assigned persons"]],
      body: companyRows.length ? companyRows : [["No data", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8, cellPadding: 2.2 },
      styles: { overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 18,halign: "center" },
        2: { cellWidth: 20,halign: "center" },
      },
    })
    y = (doc.lastAutoTable?.finalY || y) + 10

    const topCompanies = Object.entries(stats.byCompany || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)

    topCompanies.forEach(([company]) => {
      const tasks = data.filter((t) => t.party_name === company)
      if (!tasks.length) return
      if (y > pageHeight - 50) {
        doc.addPage()
        y = 16
      }
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text(`${company} (${tasks.length} tasks)`, margin, y)
      y += 3
      const rows = tasks.map((t) => [
        String(t.task_no || "-"),
        String(t.employee_name_1 || t.team_member_name || "Unassigned").slice(0, 18),
        String(t.system_name || "-").slice(0, 16),
        fmtDate(t.expected_date_to_close || t.planned3),
        String(t.status || "Pending"),
        String(t.priority || t.priority_in_customer || "Medium"),
      ])
      table(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Task #", "Person", "System", "Expected", "Status", "Priority"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [51, 65, 85], textColor: 255, fontSize: 7 },
        bodyStyles: { fontSize: 7, cellPadding: 1.4 },
      })
      y = (doc.lastAutoTable?.finalY || y) + 8
    })

    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text(`Company distribution  |  ${generatedAt}`, margin, pageHeight - 7)
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, {
        align: "right",
      })
    }

    doc.save(`company-distribution-${new Date().toISOString().split("T")[0]}.pdf`)
  } catch (err) {
    console.error("Company PDF export failed:", err)
    window.alert(`PDF export failed: ${err?.message || err}. Check browser console for details.`)
  }
}

export const getDeadlineStatus = (expectedDate) => {
  if (!expectedDate) return "no-deadline"
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expected = new Date(expectedDate)
  if (expected.toDateString() === today.toDateString()) return "today"
  if (expected > today) return "upcoming"
  return "overdue"
}
