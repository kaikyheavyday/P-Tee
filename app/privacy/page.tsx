import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | P' Tee",
  description: "นโยบายความเป็นส่วนตัวของ P' Tee",
};

const effectiveDate = "6 พฤษภาคม 2569";
const serviceName = "P' Tee";
const contactEmail = "bitetynano@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-8 text-foreground sm:px-8">
      <article className="space-y-8">
        <header className="space-y-3 border-b border-border pb-6">
          <p className="text-sm font-medium text-brand-700">{serviceName}</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            นโยบายความเป็นส่วนตัว
          </h1>
          <p className="text-sm text-muted-foreground">
            วันที่มีผลบังคับใช้: {effectiveDate}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">ภาพรวม</h2>
          <p className="leading-7 text-muted-foreground">
            {serviceName} เป็นบริการบันทึกอาหารและประมาณแคลอรี่ผ่าน LINE Mini App
            นโยบายนี้อธิบายว่าเราเก็บ ใช้ เปิดเผย และดูแลข้อมูลส่วนบุคคลของผู้ใช้อย่างไร
            เมื่อผู้ใช้เปิดใช้งานบริการ ถือว่าผู้ใช้รับทราบการประมวลผลข้อมูลตามนโยบายนี้
          </p>
        </section>

        <Section title="ข้อมูลที่เราเก็บ">
          <ul className="list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
            <li>
              ข้อมูลจาก LINE Login และ LIFF เช่น LINE user ID, ชื่อแสดงผล,
              รูปโปรไฟล์ และ ID token ที่ใช้ยืนยันตัวตนกับเซิร์ฟเวอร์ของเรา
            </li>
            <li>
              ข้อมูลโปรไฟล์สุขภาพที่ผู้ใช้กรอก เช่น เพศ วันเกิด ส่วนสูง น้ำหนัก
              ระดับกิจกรรม เป้าหมาย และเป้าหมายแคลอรี่รายวัน
            </li>
            <li>
              ข้อมูลอาหาร เช่น ข้อความที่พิมพ์ รูปภาพอาหาร ผลประมาณแคลอรี่
              สารอาหาร เวลา และประวัติรายการอาหาร
            </li>
            <li>
              ข้อมูลทางเทคนิค เช่น เวลาใช้งาน ข้อผิดพลาดของระบบ
              และข้อมูลที่จำเป็นต่อการรักษาความปลอดภัยของบริการ
            </li>
          </ul>
        </Section>

        <Section title="วัตถุประสงค์ในการใช้ข้อมูล">
          <ul className="list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
            <li>ยืนยันตัวตนผู้ใช้และเชื่อมบัญชีกับ LINE Mini App</li>
            <li>คำนวณเป้าหมายแคลอรี่รายวันจากข้อมูลที่ผู้ใช้กรอก</li>
            <li>ประมาณแคลอรี่และสารอาหารจากข้อความหรือรูปภาพอาหาร</li>
            <li>บันทึกและแสดงประวัติอาหาร สรุปประจำวัน และความคืบหน้าตามเป้าหมาย</li>
            <li>ปรับปรุงความเสถียร ความปลอดภัย และคุณภาพของบริการ</li>
            <li>ติดต่อผู้ใช้เมื่อจำเป็น เช่น การตอบคำถามหรือคำขอลบข้อมูล</li>
          </ul>
        </Section>

        <Section title="การใช้บริการภายนอก">
          <p className="leading-7 text-muted-foreground">
            เราใช้บริการภายนอกเพื่อให้แอปทำงานได้ ได้แก่ LINE สำหรับการเข้าสู่ระบบและ Mini App,
            Supabase สำหรับฐานข้อมูลและการจัดเก็บข้อมูล, Vercel สำหรับโฮสติ้ง,
            และผู้ให้บริการ AI เช่น OpenAI หรือ Google Gemini เพื่อช่วยประเมินอาหารจากข้อความหรือรูปภาพ
            ข้อมูลที่ส่งให้ผู้ให้บริการเหล่านี้จะจำกัดเท่าที่จำเป็นต่อการให้บริการ
          </p>
        </Section>

        <Section title="การเปิดเผยข้อมูล">
          <p className="leading-7 text-muted-foreground">
            เราไม่ขายข้อมูลส่วนบุคคลของผู้ใช้ เราอาจเปิดเผยข้อมูลต่อผู้ให้บริการที่จำเป็นต่อการทำงานของระบบ
            หรือเมื่อกฎหมาย หน่วยงานรัฐ หรือกระบวนการทางกฎหมายกำหนดให้ต้องเปิดเผย
          </p>
        </Section>

        <Section title="การเก็บรักษาและการลบข้อมูล">
          <p className="leading-7 text-muted-foreground">
            เราเก็บข้อมูลตราบเท่าที่จำเป็นต่อการให้บริการ การรักษาความปลอดภัย
            และการปฏิบัติตามกฎหมาย ผู้ใช้สามารถขอลบข้อมูลบัญชีและประวัติอาหารได้โดยติดต่อเรา
            เมื่อได้รับคำขอ เราจะดำเนินการลบหรือทำให้ข้อมูลไม่สามารถระบุตัวบุคคลได้ภายในระยะเวลาที่เหมาะสม
          </p>
        </Section>

        <Section title="ความถูกต้องของข้อมูลสุขภาพและ AI">
          <p className="leading-7 text-muted-foreground">
            ผลประมาณแคลอรี่และสารอาหารจาก AI เป็นข้อมูลเพื่อช่วยติดตามอาหารเท่านั้น
            ไม่ใช่คำแนะนำทางการแพทย์ โภชนาการ หรือการรักษา ผู้ใช้ควรปรึกษาผู้เชี่ยวชาญด้านสุขภาพ
            หากมีโรคประจำตัว ภาวะสุขภาพเฉพาะ หรือจำเป็นต้องควบคุมอาหารอย่างเคร่งครัด
          </p>
        </Section>

        <Section title="สิทธิของผู้ใช้">
          <p className="leading-7 text-muted-foreground">
            ผู้ใช้สามารถติดต่อเราเพื่อขอเข้าถึง แก้ไข ลบ หรือสอบถามเกี่ยวกับข้อมูลส่วนบุคคลของตนได้
            เราอาจขอข้อมูลเพิ่มเติมเพื่อยืนยันตัวตนก่อนดำเนินการตามคำขอ
          </p>
        </Section>

        <Section title="การเปลี่ยนแปลงนโยบายนี้">
          <p className="leading-7 text-muted-foreground">
            เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว เมื่อมีการเปลี่ยนแปลงสำคัญ
            เราจะปรับวันที่มีผลบังคับใช้บนหน้านี้ และอาจแจ้งผู้ใช้ผ่านช่องทางที่เหมาะสม
          </p>
        </Section>

        <footer className="space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            ติดต่อเกี่ยวกับความเป็นส่วนตัว: {" "}
            <a
              className="font-medium text-brand-700 underline"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          </p>
          <p>
            อ่าน {" "}
            <Link className="font-medium text-brand-700 underline" href="/terms">
              ข้อกำหนดการใช้บริการ
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-border/70 pb-6 last:border-b-0">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
