import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 假資料 — 格式正確但純屬虛構，用來示範讀取時去識別化
const members = [
  {
    name: "王小明",
    phone: "0912345678",
    email: "ming.wang@example.com",
    idNumber: "A123456789",
    address: "台北市大安區信義路四段1號",
    birthday: "1990-03-15",
  },
  {
    name: "陳美玲",
    phone: "0922333444",
    email: "meiling.chen@example.com",
    idNumber: "B223456788",
    address: "新北市板橋區文化路二段100號5樓",
    birthday: "1985-11-02",
  },
  {
    name: "林志豪",
    phone: "0933555777",
    email: "zhihao.lin@example.com",
    idNumber: "C123456780",
    address: "台中市西屯區台灣大道三段99號",
    birthday: "1992-07-21",
  },
  {
    name: "黃淑芬",
    phone: "0955888999",
    email: "shufen.huang@example.com",
    idNumber: "D200000001",
    address: "高雄市苓雅區中正一路50號12樓之3",
    birthday: "1978-01-30",
  },
  {
    name: "張家偉",
    phone: "0966111222",
    email: "wei.chang@example.com",
    idNumber: "E123456789",
    address: "桃園市中壢區中央西路一段88巷7號",
    birthday: "2001-09-09",
  },
];

async function main() {
  await prisma.member.deleteMany();
  await prisma.member.createMany({ data: members });
  console.log(`Seeded ${members.length} members.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
