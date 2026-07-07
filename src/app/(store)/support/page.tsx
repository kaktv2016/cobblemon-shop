import { AccordionItem } from "@/components/store/accordion-item";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail } from "lucide-react";

export const metadata = {
  title: "ศูนย์ช่วยเหลือ - Cobblemon Divided",
  description: "คำถามที่พบบ่อยและช่องทางติดต่อทีมงานของ Cobblemon Divided",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <section className="border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 to-slate-850 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-slate-100">ศูนย์ช่วยเหลือ</h1>
          <p className="mt-4 text-lg text-slate-400">
            รวมคำถามที่พบบ่อยและช่องทางติดต่อทีมงานสำหรับผู้เล่น Cobblemon Divided
          </p>
        </div>
      </section>

      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-slate-100">เริ่มต้นใช้งาน</h2>
            <div className="space-y-3">
              <AccordionItem title="สมัครบัญชีผู้เล่นยังไง?">
                <p>
                  กดปุ่มสมัครสมาชิกจากหน้าแรก แล้วกรอกอีเมล ชื่อผู้ใช้ และรหัสผ่านให้ครบถ้วน
                  จากนั้นคุณก็พร้อมเข้าสู่ระบบและเริ่มใช้งานร้านค้าได้ทันที
                </p>
              </AccordionItem>

              <AccordionItem title="เชื่อมบัญชี Minecraft ยังไง?">
                <p>
                  ไปที่หน้าการตั้งค่าบัญชี แล้วเลือกเมนูเชื่อมบัญชี Minecraft จากนั้นกรอกชื่อในเกมของคุณ
                  เพื่อให้ระบบตรวจสอบและเตรียมส่งของรางวัลเข้าบัญชีได้ถูกต้อง
                </p>
              </AccordionItem>

              <AccordionItem title="เลือกดูสินค้าในร้านยังไง?">
                <p>
                  เข้าหน้าร้านค้าเพื่อดูแรงก์ ไอเทมตกแต่ง เงินในเกม กุญแจ และแพ็กเกจต่าง ๆ
                  คุณสามารถเลือกตามหมวดที่ต้องการ แล้วกดเข้าสู่หน้าสินค้าเพื่อดูรายละเอียดก่อนสั่งซื้อได้
                </p>
              </AccordionItem>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-slate-100">การสั่งซื้อและการชำระเงิน</h2>
            <div className="space-y-3">
              <AccordionItem title="ซื้อสินค้าอย่างไร?">
                <p>
                  เลือกสินค้าที่ต้องการ กดเพิ่มลงตะกร้า แล้วตรวจสอบรายการให้เรียบร้อย
                  เมื่อพร้อมแล้วให้กดชำระเงินและทำตามขั้นตอน ระบบจะเตรียมส่งของให้หลังการชำระเงินสำเร็จ
                </p>
              </AccordionItem>

              <AccordionItem title="รองรับช่องทางชำระเงินอะไรบ้าง?">
                <p>
                  ร้านค้ารองรับบัตรเครดิตหลัก, PayPal และกระเป๋าเงินดิจิทัลบางประเภท
                  การชำระเงินทั้งหมดถูกประมวลผลผ่านระบบที่ปลอดภัยตามมาตรฐานสากล
                </p>
              </AccordionItem>

              <AccordionItem title="ซื้อแล้วจะได้ของเมื่อไร?">
                <p>
                  สินค้าส่วนใหญ่จะถูกส่งภายในไม่กี่นาทีหลังจากชำระเงินสำเร็จ
                  บางรายการอาจใช้เวลานานขึ้นขึ้นอยู่กับประเภทของรางวัลหรือระบบจัดส่งในช่วงเวลานั้น
                </p>
              </AccordionItem>

              <AccordionItem title="ถ้าจ่ายเงินไม่ผ่านต้องทำอย่างไร?">
                <p>
                  คำสั่งซื้อจะยังคงอยู่ในสถานะรอการชำระเงิน คุณสามารถลองชำระใหม่ได้จากหน้าคำสั่งซื้อ
                  หากยังมีปัญหาอยู่ กรุณาติดต่อทีมงานผ่าน Discord หรืออีเมล
                </p>
              </AccordionItem>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-slate-100">การจัดส่งไอเทม</h2>
            <div className="space-y-3">
              <AccordionItem title="ไอเทมถูกส่งอย่างไร?">
                <p>
                  ระบบจะจัดส่งของรางวัลไปยังบัญชี Minecraft ที่คุณเชื่อมไว้โดยอัตโนมัติ
                  เมื่อการชำระเงินผ่านเรียบร้อย ไอเทมหรือสิทธิพิเศษจะถูกจัดคิวเพื่อส่งเข้าตัวละครของคุณ
                </p>
              </AccordionItem>

              <AccordionItem title="ถ้าส่งของไม่สำเร็จจะเกิดอะไรขึ้น?">
                <p>
                  ระบบจะพยายามส่งซ้ำให้อัตโนมัติหลายครั้ง หากยังไม่สำเร็จ กรุณาติดต่อทีมงานพร้อมหมายเลขคำสั่งซื้อ
                  เพื่อให้เราตรวจสอบและช่วยจัดการด้วยตนเอง
                </p>
              </AccordionItem>

              <AccordionItem title="เช็กสถานะการส่งของได้ที่ไหน?">
                <p>
                  ไปที่ บัญชีผู้ใช้ {" > "} ประวัติคำสั่งซื้อ แล้วเปิดรายการที่ต้องการ
                  คุณจะเห็นสถานะตั้งแต่สร้างคำสั่งซื้อ ชำระเงิน กำลังส่ง จนถึงส่งสำเร็จ
                </p>
              </AccordionItem>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-slate-100">บัญชีและความปลอดภัย</h2>
            <div className="space-y-3">
              <AccordionItem title="เปลี่ยนรหัสผ่านได้ที่ไหน?">
                <p>
                  ไปที่ การตั้งค่าบัญชี {" > "} ความปลอดภัย แล้วเลือกเปลี่ยนรหัสผ่าน
                  กรอกรหัสผ่านเดิมและรหัสผ่านใหม่ที่ต้องการใช้งาน
                </p>
              </AccordionItem>

              <AccordionItem title="ยกเลิกการเชื่อมบัญชี Minecraft ได้ไหม?">
                <p>
                  ได้ คุณสามารถไปที่ การตั้งค่าบัญชี {" > "} บัญชี Minecraft แล้วเลือกยกเลิกการเชื่อมต่อ
                  โดยคำสั่งซื้อที่ผ่านมาจะไม่หาย แต่คำสั่งซื้อใหม่ในอนาคตจะต้องเชื่อมบัญชีก่อน
                </p>
              </AccordionItem>

              <AccordionItem title="มีคำแนะนำเรื่องความปลอดภัยไหม?">
                <p>
                  ควรใช้รหัสผ่านที่คาดเดายาก ไม่แชร์ข้อมูลเข้าสู่ระบบกับผู้อื่น
                  และตรวจสอบอีเมลกับกิจกรรมในบัญชีของคุณอย่างสม่ำเสมอ
                </p>
              </AccordionItem>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-slate-100">การคืนสินค้าและการช่วยเหลือเพิ่มเติม</h2>
            <div className="space-y-3">
              <AccordionItem title="นโยบายการคืนสินค้าเป็นอย่างไร?">
                <p>
                  โดยทั่วไปไอเทมดิจิทัลที่ส่งสำเร็จแล้วจะไม่สามารถขอคืนเงินได้
                  แต่หากเกิดปัญหาทางเทคนิคหรือระบบส่งของผิดพลาด ทีมงานจะพิจารณาเป็นกรณีไป
                </p>
              </AccordionItem>

              <AccordionItem title="ต้องการขอคืนเงินต้องทำยังไง?">
                <p>
                  ติดต่อทีมงานพร้อมหมายเลขคำสั่งซื้อและรายละเอียดปัญหาที่พบ
                  เราจะตรวจสอบให้และแจ้งผลกลับโดยเร็วที่สุด
                </p>
              </AccordionItem>

              <AccordionItem title="ยังต้องการความช่วยเหลือเพิ่มเติม">
                <p>
                  หากคำถามของคุณไม่ได้อยู่ในหน้านี้ สามารถติดต่อทีมงานได้ผ่าน Discord
                  หรืออีเมลเพื่อรับการช่วยเหลือแบบตรงจุดมากขึ้น
                </p>
              </AccordionItem>
            </div>
          </div>

          <Card className="border-indigo-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold text-slate-100">ยังต้องการความช่วยเหลืออยู่ไหม?</h2>
            <p className="mb-6 text-slate-400">
              ถ้ายังหาคำตอบไม่เจอ สามารถติดต่อทีมงานของ Cobblemon Divided ได้โดยตรง
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://discord.gg/example"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  เข้าร่วม Discord
                </Button>
              </a>
              <a href="mailto:support@cobblemart.example">
                <Button variant="secondary" className="bg-slate-700 hover:bg-slate-600">
                  <Mail className="mr-2 h-4 w-4" />
                  ส่งอีเมลหาเรา
                </Button>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
