import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้บริการ | P' Tee",
  description: "ข้อกำหนดการใช้บริการของ P' Tee",
};

const effectiveDate = "6 พฤษภาคม 2569";
const serviceName = "P' Tee";
const contactEmail = "bitetynano@gmail.com";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-8 text-foreground sm:px-8">
      <article className="space-y-8">
        <header className="space-y-3 border-b border-border pb-6">
          <p className="text-sm font-medium text-brand-700">{serviceName}</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            ข้อกำหนดการใช้บริการ
          </h1>
          <p className="text-sm text-muted-foreground">
            วันที่มีผลบังคับใช้: {effectiveDate}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">การยอมรับข้อกำหนด</h2>
          <p className="leading-7 text-muted-foreground">
            เมื่อผู้ใช้เข้าถึงหรือใช้งาน {serviceName} ผ่าน LINE Mini App
            ถือว่าผู้ใช้ตกลงปฏิบัติตามข้อกำหนดนี้ หากไม่ยอมรับข้อกำหนดนี้
            ผู้ใช้ควรหยุดใช้งานบริการ
          </p>
        </section>

        <Section title="ลักษณะของบริการ">
          <p className="leading-7 text-muted-foreground">
            {serviceName} เป็นบริการช่วยบันทึกอาหาร ประมาณแคลอรี่และสารอาหาร
            และแสดงความคืบหน้าตามเป้าหมายรายวัน โดยอาศัยข้อมูลที่ผู้ใช้กรอก
            รวมถึงการประมวลผลด้วย AI จากข้อความหรือรูปภาพอาหาร
          </p>
        </Section>

        <Section title="บัญชีและการใช้งานผ่าน LINE">
          <p className="leading-7 text-muted-foreground">
            บริการนี้ใช้งานผ่าน LINE Mini App และ LINE Login ผู้ใช้ต้องรับผิดชอบต่อการดูแลบัญชี LINE
            ของตนเอง และต้องไม่ใช้งานบัญชีของผู้อื่นโดยไม่ได้รับอนุญาต
          </p>
        </Section>

        <Section title="ความรับผิดชอบของผู้ใช้">
          <ul className="list-disc space-y-2 pl-5 leading-7 text-muted-foreground">
            <li>ให้ข้อมูลส่วนสูง น้ำหนัก เป้าหมาย และรายการอาหารตามความเป็นจริงเท่าที่ทำได้</li>
            <li>ตรวจสอบและแก้ไขผลประมาณแคลอรี่ก่อนนำไปใช้ประกอบการตัดสินใจ</li>
            <li>ไม่ส่งข้อมูล รูปภาพ หรือเนื้อหาที่ผิดกฎหมาย ละเมิดสิทธิผู้อื่น หรือเป็นอันตรายต่อระบบ</li>
            <li>ไม่พยายามเข้าถึงข้อมูลของผู้ใช้อื่นหรือรบกวนการทำงานของบริการ</li>
          </ul>
        </Section>

        <Section title="ข้อจำกัดเกี่ยวกับข้อมูลสุขภาพ">
          <p className="leading-7 text-muted-foreground">
            ผลประมาณแคลอรี่ สารอาหาร BMI, BMR, TDEE หรือเป้าหมายแคลอรี่เป็นข้อมูลเพื่อการติดตามทั่วไปเท่านั้น
            ไม่ใช่การวินิจฉัย การรักษา หรือคำแนะนำทางการแพทย์ ผู้ใช้ควรปรึกษาแพทย์
            นักกำหนดอาหาร หรือผู้เชี่ยวชาญด้านสุขภาพก่อนปรับอาหารหรือพฤติกรรมสุขภาพอย่างมีนัยสำคัญ
          </p>
        </Section>

        <Section title="บริการจากบุคคลที่สาม">
          <p className="leading-7 text-muted-foreground">
            บริการนี้อาจทำงานร่วมกับ LINE, Supabase, Vercel, OpenAI, Google Gemini
            หรือผู้ให้บริการอื่นที่จำเป็นต่อการให้บริการ ผู้ใช้รับทราบว่าการใช้งานบริการเหล่านั้น
            อาจอยู่ภายใต้ข้อกำหนดและนโยบายความเป็นส่วนตัวของผู้ให้บริการแต่ละรายด้วย
          </p>
        </Section>

        <Section title="ความพร้อมใช้งานของบริการ">
          <p className="leading-7 text-muted-foreground">
            เราพยายามให้บริการทำงานได้อย่างต่อเนื่องและปลอดภัย แต่ไม่รับประกันว่าบริการจะไม่มีข้อผิดพลาด
            ไม่หยุดชะงัก หรือให้ผลลัพธ์ถูกต้องสมบูรณ์ตลอดเวลา เราอาจปรับปรุง ระงับ
            หรือเปลี่ยนแปลงฟีเจอร์บางส่วนเมื่อจำเป็น
          </p>
        </Section>

        <Section title="การจำกัดความรับผิด">
          <p className="leading-7 text-muted-foreground">
            ภายใต้ขอบเขตที่กฎหมายอนุญาต {serviceName} จะไม่รับผิดชอบต่อความเสียหายทางตรงหรือทางอ้อม
            ที่เกิดจากการใช้งานหรือไม่สามารถใช้งานบริการ รวมถึงการนำผลประมาณแคลอรี่หรือข้อมูลสุขภาพ
            ไปใช้โดยไม่ปรึกษาผู้เชี่ยวชาญ
          </p>
        </Section>

        <Section title="การยกเลิกและการลบข้อมูล">
          <p className="leading-7 text-muted-foreground">
            ผู้ใช้สามารถหยุดใช้งานบริการได้ทุกเมื่อ และสามารถขอลบข้อมูลบัญชีหรือประวัติอาหารได้โดยติดต่อเรา
            เราจะดำเนินการตามคำขอภายในระยะเวลาที่เหมาะสมหลังจากยืนยันตัวตน
          </p>
        </Section>

        <Section title="การเปลี่ยนแปลงข้อกำหนด">
          <p className="leading-7 text-muted-foreground">
            เราอาจแก้ไขข้อกำหนดนี้เป็นครั้งคราว เมื่อมีการเปลี่ยนแปลง
            เราจะอัปเดตวันที่มีผลบังคับใช้บนหน้านี้ การใช้งานบริการต่อไปหลังการเปลี่ยนแปลง
            ถือว่าผู้ใช้ยอมรับข้อกำหนดที่ปรับปรุงแล้ว
          </p>
        </Section>

        <footer className="space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>
            ติดต่อเกี่ยวกับบริการ: {" "}
            <a
              className="font-medium text-brand-700 underline"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          </p>
          <p>
            อ่าน {" "}
            <Link className="font-medium text-brand-700 underline" href="/privacy">
              นโยบายความเป็นส่วนตัว
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
