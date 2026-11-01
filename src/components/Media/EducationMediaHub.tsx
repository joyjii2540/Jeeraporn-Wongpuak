import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Video,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Search,
  PlusCircle,
  Play,
  Download,
  ExternalLink,
  Edit3,
  Trash2,
  Clock,
  Tag,
  CheckCircle2,
  Upload,
  X,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { EducationMedia, MediaCategory, MediaType } from '../../types/media';
import { MediaStore } from '../../utils/mediaStore';

interface EducationMediaHubProps {
  isAdminLoggedIn?: boolean;
  currentUser?: any;
}

export const EducationMediaHub: React.FC<EducationMediaHubProps> = ({
  isAdminLoggedIn = false,
  currentUser,
}) => {
  const [mediaList, setMediaList] = useState<EducationMedia[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active viewing modal
  const [activeMedia, setActiveMedia] = useState<EducationMedia | null>(null);

  // Upload/Edit Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationMedia | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MediaCategory>('video');
  const [formMediaType, setFormMediaType] = useState<MediaType>('youtube');
  const [formUrl, setFormUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formTags, setFormTags] = useState('');

  const isStaffOrDoctor = isAdminLoggedIn;

  const loadMedia = () => {
    setMediaList(MediaStore.getAll());
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Filtered Media
  const filteredMedia = mediaList.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchCategory && matchSearch;
  });

  const handleOpenUpload = (item?: EducationMedia) => {
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title);
      setFormCategory(item.category);
      setFormMediaType(item.mediaType);
      setFormUrl(item.url);
      setFormThumbnailUrl(item.thumbnailUrl || '');
      setFormDescription(item.description);
      setFormDuration(item.durationOrPages || '');
      setFormTags(item.tags ? item.tags.join(', ') : '');
    } else {
      setEditingItem(null);
      setFormTitle('');
      setFormCategory('video');
      setFormMediaType('youtube');
      setFormUrl('');
      setFormThumbnailUrl('');
      setFormDescription('');
      setFormDuration('');
      setFormTags('');
    }
    setIsUploadModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'media' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'media') {
          setFormUrl(reader.result as string);
        } else {
          setFormThumbnailUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('กรุณากรอกชื่อสื่อ/วิดีโอ');
      return;
    }

    const categoryLabels: Record<MediaCategory, string> = {
      video: 'วิดีโอสาธิตหัตถการ',
      infographic: 'อินโฟกราฟิกความรู้',
      guide: 'คู่มือและเอกสารสุขภาพ',
      herbal: 'ตำรับยาสมุนไพร',
    };

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const authorName = currentUser?.name || 'แพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว';

    if (editingItem) {
      MediaStore.update(editingItem.id, {
        title: formTitle,
        category: formCategory,
        categoryLabel: categoryLabels[formCategory],
        mediaType: formMediaType,
        url: formUrl,
        thumbnailUrl: formThumbnailUrl || undefined,
        description: formDescription,
        durationOrPages: formDuration || undefined,
        tags: tagsArray,
      });
    } else {
      MediaStore.add({
        title: formTitle,
        category: formCategory,
        categoryLabel: categoryLabels[formCategory],
        mediaType: formMediaType,
        url: formUrl,
        thumbnailUrl: formThumbnailUrl || undefined,
        description: formDescription,
        durationOrPages: formDuration || undefined,
        author: authorName,
        tags: tagsArray,
      });
    }

    setIsUploadModalOpen(false);
    loadMedia();
  };

  const handleDeleteMedia = (id: string, title: string) => {
    if (confirm(`คุณต้องการลบสื่อ "${title}" ออกจากคลังความรู้ใช่หรือไม่?`)) {
      MediaStore.delete(id);
      loadMedia();
    }
  };

  // Convert YouTube standard URL to embed URL
  const getEmbedYoutubeUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('embed/')) return url;
      if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-emerald-700/60">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-emerald-700/80 text-emerald-200 px-3 py-1 rounded-full font-semibold border border-emerald-600/60 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>คลังความรู้และสื่อสุขภาพออนไลน์</span>
            </span>
            <span className="text-emerald-200/90 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            คลังสื่อวิดีโอและเอกสารสุขภาพ <br className="hidden sm:inline" />
            <span className="text-emerald-300 font-semibold">กลุ่มงานการแพทย์แผนไทย</span>
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl font-light">
            รวบรวมสื่อวิดีโอสาธิตการดูแลสุขภาพ กายบริหารฤๅษีดัดตน อินโฟกราฟิกตำรับสมุนไพร 
            และคู่มือการปฏิบัติตัวสำหรับคนไข้และมารดาหลังคลอด โดยแพทย์แผนไทยและทีมผู้ช่วยแพทย์แผนไทย
          </p>

          {isStaffOrDoctor && (
            <div className="pt-2">
              <button
                onClick={() => handleOpenUpload()}
                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-98"
              >
                <PlusCircle className="w-4 h-4 text-emerald-700" />
                <span>+ อัปโหลดสื่อ / วิดีโอ / เอกสารใหม่</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            ทั้งหมด ({mediaList.length})
          </button>
          <button
            onClick={() => setSelectedCategory('video')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'video'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>วิดีโอสาธิต</span>
          </button>
          <button
            onClick={() => setSelectedCategory('infographic')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'infographic'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>อินโฟกราฟิก</span>
          </button>
          <button
            onClick={() => setSelectedCategory('guide')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'guide'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>คู่มือ & เอกสาร</span>
          </button>
          <button
            onClick={() => setSelectedCategory('herbal')}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'herbal'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ตำรับสมุนไพร</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อสื่อ หรืออาการ..."
            className="w-full pl-9 pr-3.5 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Media Cards Grid */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 text-stone-400 space-y-2">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto" />
          <p className="text-sm font-semibold text-stone-700">ไม่พบสื่อความรู้ที่ค้นหา</p>
          <p className="text-xs text-stone-400">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Media Thumbnail with badge */}
                <div
                  onClick={() => setActiveMedia(item)}
                  className="relative aspect-video bg-stone-100 overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.thumbnailUrl || '/assets/images/thai_clinic_hero_1792986606917.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-stone-950/20 group-hover:bg-stone-950/40 transition-colors flex items-center justify-center">
                    {item.mediaType === 'youtube' || item.mediaType === 'video_file' ? (
                      <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white translate-x-0.5" />
                      </div>
                    ) : item.mediaType === 'pdf' ? (
                      <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md">
                        <FileText className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-900/80 text-white flex items-center justify-center shadow-md">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Duration / Pages Pill */}
                  {item.durationOrPages && (
                    <span className="absolute bottom-2.5 right-2.5 bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                      {item.durationOrPages}
                    </span>
                  )}

                  {/* Category Pill */}
                  <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
                    {item.categoryLabel}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3
                    onClick={() => setActiveMedia(item)}
                    className="font-bold text-sm text-stone-900 line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors leading-snug"
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                <span className="text-[11px] truncate max-w-[170px] text-stone-500">
                  {item.author}
                </span>

                <div className="flex items-center gap-1.5">
                  {isStaffOrDoctor && (
                    <>
                      <button
                        onClick={() => handleOpenUpload(item)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMedia(item.id, item.title)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveMedia(item)}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs transition-colors"
                  >
                    เปิดดู
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 1: VIEW MEDIA (VIDEO / INFOGRAPHIC / PDF)   */}
      {/* ================================================= */}
      {activeMedia && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 space-y-4 p-5 sm:p-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  {activeMedia.categoryLabel}
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-stone-900 mt-1 leading-snug">
                  {activeMedia.title}
                </h3>
                <span className="text-xs text-stone-400 mt-0.5 block">
                  เผยแพร่โดย: {activeMedia.author} · ตึกแพทย์แผนไทย ศูนย์เวชปฏิบัติครอบครัว รพ.อยุธยา
                </span>
              </div>
              <button
                onClick={() => setActiveMedia(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Player / Viewer Body */}
            <div>
              {activeMedia.mediaType === 'youtube' ? (
                <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
                  <iframe
                    src={getEmbedYoutubeUrl(activeMedia.url)}
                    title={activeMedia.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : activeMedia.mediaType === 'video_file' ? (
                <div className="aspect-video rounded-2xl overflow-hidden bg-black">
                  <video src={activeMedia.url} controls className="w-full h-full object-contain" />
                </div>
              ) : activeMedia.mediaType === 'image' || activeMedia.category === 'infographic' ? (
                <div className="rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center max-h-[500px]">
                  <img
                    src={activeMedia.url || activeMedia.thumbnailUrl}
                    alt={activeMedia.title}
                    className="w-full h-full object-contain max-h-[500px]"
                  />
                </div>
              ) : (
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-center">
                  <FileText className="w-12 h-12 text-emerald-700 mx-auto" />
                  <h4 className="font-bold text-stone-800 text-sm">เอกสารคู่มือสุขภาพแพทย์แผนไทย</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    {activeMedia.description}
                  </p>
                  {activeMedia.url && activeMedia.url !== '#' && (
                    <a
                      href={activeMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ดาวน์โหลดเอกสาร (PDF)</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Detailed Description */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-xs text-stone-800">รายละเอียดสาระความรู้:</h4>
              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-100">
                {activeMedia.description}
              </p>
            </div>

            {/* Tags */}
            {activeMedia.tags && activeMedia.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-400">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>คำค้นหา:</span>
                {activeMedia.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md text-[11px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL 2: UPLOAD / EDIT MEDIA (STAFF & DOCTOR)    */}
      {/* ================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900">
                  {editingItem ? 'แก้ไขสื่อความรู้' : '+ อัปโหลดสื่อความรู้ / วิดีโอใหม่'}
                </h3>
                <span className="text-[11px] text-stone-400">
                  สำหรับเผยแพร่ในคลังความรู้สุขภาพแพทย์แผนไทย
                </span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">ชื่อสื่อ / หัวข้อวิดีโอ</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="เช่น ท่าบริหารแก้ออฟฟิศซินโดรมด้วยฤๅษีดัดตน"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">หมวดหมู่</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MediaCategory)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                  >
                    <option value="video">วิดีโอสาธิต</option>
                    <option value="infographic">อินโฟกราฟิก</option>
                    <option value="guide">คู่มือและเอกสาร</option>
                    <option value="herbal">ตำรับสมุนไพร</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">ประเภทสื่อ</label>
                  <select
                    value={formMediaType}
                    onChange={(e) => setFormMediaType(e.target.value as MediaType)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                  >
                    <option value="youtube">YouTube Video</option>
                    <option value="image">รูปภาพ / อินโฟกราฟิก</option>
                    <option value="pdf">เอกสาร PDF</option>
                    <option value="article">บทความความรู้</option>
                    <option value="video_file">ไฟล์วิดีโอ (MP4)</option>
                  </select>
                </div>
              </div>

              {/* URL or File Upload */}
              {formMediaType === 'youtube' ? (
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    ลิงก์วิดีโอ YouTube (URL)
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-700 block">อัปโหลดไฟล์สื่อจากเครื่อง</span>
                  <label className="px-3.5 py-2 bg-white hover:bg-stone-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 cursor-pointer inline-flex items-center gap-1.5 text-xs shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์รูปภาพ / เอกสาร (PDF)</span>
                    <input
                      type="file"
                      accept={formMediaType === 'pdf' ? '.pdf' : 'image/*,video/*'}
                      onChange={(e) => handleFileUpload(e, 'media')}
                      className="hidden"
                    />
                  </label>
                  {formUrl && (
                    <span className="text-[10px] text-emerald-700 block font-mono">
                      ✓ อัปโหลดไฟล์เรียบร้อยแล้ว
                    </span>
                  )}
                </div>
              )}

              {/* Thumbnail */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  รูปภาพหน้าปกสื่อ (Thumbnail URL หรือ อัปโหลด)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formThumbnailUrl}
                    onChange={(e) => setFormThumbnailUrl(e.target.value)}
                    placeholder="ใส่ลิงก์รูป หรือกดอัปโหลด"
                    className="flex-1 px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-[11px]"
                  />
                  <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl cursor-pointer text-xs flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลด</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'thumbnail')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  คำอธิบายเนื้อหาและสาระสำคัญ
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="อธิบายสรุปเนื้อหา ประโยชน์ ข้อควรระวัง..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">ความยาว / จำนวนหน้า</label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="เช่น 10 นาที หรือ 4 หน้า"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">คำค้นหา / Tags (คั่นด้วยจุลภาค)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="ออฟฟิศซินโดรม, ยาสมุนไพร"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl font-bold shadow-2xs"
                >
                  บันทึกสื่อความรู้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
