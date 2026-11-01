/**
 * Types & Schema for Health Education Media & Resources
 * คลังความรู้ สื่อวิดีโอ อินโฟกราฟิก และเอกสารสุขภาพแพทย์แผนไทย
 */

export type MediaCategory = 'video' | 'infographic' | 'guide' | 'herbal';
export type MediaType = 'youtube' | 'video_file' | 'image' | 'pdf' | 'article';

export interface EducationMedia {
  id: string;
  title: string;
  category: MediaCategory;
  categoryLabel: string;
  mediaType: MediaType;
  url: string;
  thumbnailUrl?: string;
  description: string;
  durationOrPages?: string;
  author: string;
  createdAt: string;
  tags?: string[];
}

export const INITIAL_EDUCATION_MEDIA: EducationMedia[] = [
  {
    id: 'med-01',
    title: 'วิดีโอสาธิต: กายบริหารท่าฤๅษีดัดตน 15 ท่า บำบัดออฟฟิศซินโดรม',
    category: 'video',
    categoryLabel: 'วิดีโอสาธิตหัตถการ',
    mediaType: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder embeddable/playable
    thumbnailUrl: '/assets/images/thai_clinic_hero_1792986606917.jpg',
    description: 'ศาสตร์การยืดเหยียดเส้นเอ็นและกล้ามเนื้อตามหลักการแพทย์แผนไทย ช่วยลดอาการตึงคอบ่าไหล่และสะบักจม ทำตามได้ง่ายทุกวัน',
    durationOrPages: '12 นาที',
    author: 'กลุ่มงานการแพทย์แผนไทย รพ.พระนครศรีอยุธยา',
    createdAt: '2026-10-15T09:00:00Z',
    tags: ['ออฟฟิศซินโดรม', 'ฤๅษีดัดตน', 'นวดบำบัด'],
  },
  {
    id: 'med-02',
    title: 'การดูแลมารดาหลังคลอดด้วยศาสตร์ทับหม้อเกลือและเข้าตะเกียบ',
    category: 'guide',
    categoryLabel: 'คู่มือมารดาหลังคลอด',
    mediaType: 'article',
    url: '',
    thumbnailUrl: '/assets/images/thai_herbal_pot_1792986606686.jpg',
    description: 'ข้อแนะนำในการเตรียมตัวสำหรับคุณแม่หลังคลอดธรรมชาติ (14 วันขึ้นไป) และผ่าตัดคลอด (30 วันขึ้นไป) ขั้นตอนการทับหม้อเกลือสมุนไพรสดและประโยชน์ต่อมดลูก',
    durationOrPages: 'อ่าน 4 นาที',
    author: 'พท.ว. ชญานิศ (แพทย์แผนไทย)',
    createdAt: '2026-10-18T10:30:00Z',
    tags: ['มารดาหลังคลอด', 'ทับหม้อเกลือ', 'ฟื้นฟูสุขภาพ'],
  },
  {
    id: 'med-03',
    title: 'อินโฟกราฟิก: ประโยชน์ของสมุนไพร 10 ชนิดในลูกประคบสด',
    category: 'infographic',
    categoryLabel: 'อินโฟกราฟิกความรู้',
    mediaType: 'image',
    url: '/assets/images/thai_herbal_pot_1792986606686.jpg',
    thumbnailUrl: '/assets/images/thai_herbal_pot_1792986606686.jpg',
    description: 'เจาะลึกสรรพคุณของ ไพล ขมิ้นชัน ผิวมะกรูด ตะไคร้ ใบมะขาม การบูร พิมเสน ช่วยคลายกล้ามเนื้อ บรรเทาอาการอักเสบ และกระตุ้นการไหลเวียนโลหิต',
    durationOrPages: '1 ภาพกราฟิก',
    author: 'แพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว',
    createdAt: '2026-10-20T14:00:00Z',
    tags: ['ลูกประคบสมุนไพร', 'สรรพคุณสมุนไพร', 'คลายกล้ามเนื้อ'],
  },
  {
    id: 'med-04',
    title: 'ข้อควรปฏิบัติก่อนและหลังการเข้าอบไอน้ำสมุนไพรเพื่อความปลอดภัย',
    category: 'video',
    categoryLabel: 'วิดีโอแนะนำบริการ',
    mediaType: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: '/assets/images/thai_clinic_hero_1792986606917.jpg',
    description: 'การวัดความดันโลหิต การดื่มน้ำชดเชย อุณหภูมิที่เหมาะสม และกลุ่มผู้ป่วยที่มีข้อห้ามในการอบสมุนไพร (เช่น ความดันสูง ไข้สูง โรคหัวใจ)',
    durationOrPages: '6 นาที',
    author: 'ทีมผู้ช่วยแพทย์แผนไทย',
    createdAt: '2026-10-22T11:00:00Z',
    tags: ['อบสมุนไพร', 'ความปลอดภัย', 'ข้อห้ามข้อควรระวัง'],
  },
  {
    id: 'med-05',
    title: 'เอกสารเผยแพร่: ตำรับยาสมุนไพรในบัญชียาหลักแห่งชาติสำหรับคลินิก',
    category: 'guide',
    categoryLabel: 'เอกสารความรู้ (PDF)',
    mediaType: 'pdf',
    url: '#',
    thumbnailUrl: '/assets/images/thai_herbal_pot_1792986606686.jpg',
    description: 'คู่มือการใช้ยาฟ้าทะลายโจร ขมิ้นชัน ยาแก้ไอมะขามป้อม ยาหอมนวโกฐ ยาประคบ และยาสมุนไพรใช้ภายนอก สั่งจ่ายโดยแพทย์แผนไทย',
    durationOrPages: 'เอกสาร 8 หน้า',
    author: 'กลุ่มงานการแพทย์แผนไทยและแพทย์ทางเลือก',
    createdAt: '2026-10-25T08:30:00Z',
    tags: ['ยาสมุนไพร', 'ยาหลักแห่งชาติ', 'การรักษา'],
  },
];
