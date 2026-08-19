import { db } from "../src/lib/db";

async function main() {
  const staffUsers = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, nik: true },
    orderBy: { name: "asc" },
  });
  console.log("ALL USERS IN DB:", staffUsers.length);
  const staffRoleUsers = staffUsers.filter(u => 
    ["pendidik", "admin", "super_admin", "SUPER_ADMIN", "pendidik,admin", "admin,pendidik"].includes(u.role)
  );
  console.log("STAFF USERS MATCHED BY ROLE FILTER:", staffRoleUsers.length);

  const slips = await db.salarySlip.findMany();
  console.log("SLIPS COUNT IN DB:", slips.length);

  const empMap = new Map(staffRoleUsers.map(u => [u.id, u]));
  slips.forEach(s => {
    const matched = empMap.get(s.employeeId);
    console.log(`SLIP ${s.id}: Month ${s.month}/${s.year} - EmpId: ${s.employeeId} - Name: ${matched ? matched.name : 'NOT FOUND'} - Base: ${s.baseSalary} - Status: ${s.status}`);
  });
}

main().catch(console.error).finally(() => process.exit());
