"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image";
import {
  Clipboard, Search, UserCheck, Package, Code, Book, BarChart, Cpu, PenTool, Globe,
  Palette, Music, ShieldCheck, FileText, MessageCircle, Wallet, Headphones
} from "lucide-react";


function HowItWorksSection() {
  const steps = [
    {
      id: 1,
      title: "اضف تفاصيل العمل والمهارات المطلوبة",
      icon: <Clipboard className="w-6 h-6 text-primary" />,
    },
    {
      id: 2,
      title: "قارن العروض وتصفح ملفات الأكاديميين",
      icon: <Search className="w-6 h-6 text-primary" />,
    },
    {
      id: 3,
      title: "اختار الأكاديمي المناسب",
      icon: <UserCheck className="w-6 h-6 text-primary" />,
    },
    {
      id: 4,
      title: "استلم العمل",
      icon: <Package className="w-6 h-6 text-primary" />,
    },
  ];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 text-right">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          هل لديك مشروع تريد انجازه؟
        </h2>

        <ol className="flex flex-col md:flex-row gap-8">
          {steps.map((step) => (
            <li
              key={step.id}
              className="flex flex-col items-center md:items-start text-center md:text-right flex-1 bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full text-center">
                  {step.icon}
                </div>
              </div>
              <span className="font-semibold text-lg">
                {step.id}. {step.title}
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-12 text-center md:text-right">
          ابدأ اليوم وانضم إلى مجتمع أكاديميين موثوق لتنجز أعمالك بسرعة وجودة عالية.
        </p>
      </div>
    </section>
  );
}


function HeroSection() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!keyword || !keyword.trim()) return;
    router.push(`/services?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <div className="h-[90vh] flex flex-col md:flex-row items-center justify-between mt-5 gap-10">

      {/* Right Content */}
      <div className="flex-1 flex flex-col items-center lg:items-start justify-center lg:text-right">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          مرحباً بك في&nbsp;
          <span className="text-primary inline">بارق</span>
        </h1>

        <p className="text-base sm:text-lg mb-8">
          ابحث عن أفضل الخدمات الأكاديمية والمشاريع
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center relative bg-background rounded-full shadow-md overflow-hidden w-full max-w-md transition-transform transform hover:scale-[1.02]">
          <Input
            type="text"
            placeholder="ابحث عن خدمة"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1  border-none focus:ring-2 focus:ring-primary placeholder-gray-400 py-3 md:py-4 text-gray-400 text-base md:text-lg text-right bg-white"
          />

          <Button
            type="submit"
            variant="default"
            className="rounded-full absolute left-0 px-6 py-3 md:px-8 md:py-4 bg-primary text-background font-semibold hover:bg-primary/90 transition-colors text-base md:text-lg"
          >
            بحث
          </Button>
        </form>


      </div>

      {/* Left Image */}
      <div className="hidden lg:flex w-[30vw] relative h-[70vh]">
        <Image
          src="/team-collaboration.svg"
          alt="Team Collaboration"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}


function CategoriesSection() {
  const categories = [
    {
      id: 1,
      title: "الحاسوب",
      icon: <Cpu className="w-10 h-10 text-primary" />,
      subcategories: ["برمجة", "شبكات", "ذكاء اصطناعي"],
    },
    {
      id: 2,
      title: "الرياضيات",
      icon: <BarChart className="w-10 h-10 text-primary" />,
      subcategories: ["احصاء", "جبر", "تحليل"],
    },
    {
      id: 3,
      title: "الفيزياء",
      icon: <Book className="w-10 h-10 text-primary" />,
      subcategories: ["ميكانيكا", "كهرومغناطيسية", "ضوء"],
    },
    {
      id: 4,
      title: "الاقتصاد",
      icon: <Code className="w-10 h-10 text-primary" />,
      subcategories: ["تمويل", "ادارة", "تجارة"],
    },
    {
      id: 5,
      title: "التصميم",
      icon: <PenTool className="w-10 h-10 text-primary" />,
      subcategories: ["تصميم جرافيك", "UI/UX", "تصميم شعارات"],
    },
    {
      id: 6,
      title: "اللغات",
      icon: <Globe className="w-10 h-10 text-primary" />,
      subcategories: ["الإنجليزية", "الفرنسية", "الإسبانية"],
    },
    {
      id: 7,
      title: "الفنون",
      icon: <Palette className="w-10 h-10 text-primary" />,
      subcategories: ["رسم", "تصوير", "نحت"],
    },
    {
      id: 8,
      title: "الموسيقى",
      icon: <Music className="w-10 h-10 text-primary" />,
      subcategories: ["عزف", "تأليف", "تحليل موسيقي"],
    },
  ];

  return (
    <section className="py-20">
      <div className="max-w-6xl text-right">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">المجالات</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categories.map((cat) => (
            <div key={cat.id} className="group text-right">
              {/* Category Card */}
              <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  {cat.icon}
                  <h3 className="text-xl font-semibold">{cat.title}</h3>
                </div>

                <ul className="flex flex-col gap-1">
                  {cat.subcategories.map((sub, idx) => (
                    <li key={idx} className="text-lg text-label font-bold mr-1.5">
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GuaranteeSection() {
  const items = [
    {
      icon: <UserCheck className="w-10 h-10 text-primary" />,
      title: "أكاديميون محترفون",
      description:
        "نقدّم لك نخبة من الأكاديميين المتخصصين في مختلف المجالات، بملفات موثقة وهويات معتمدة.",
    },
    {
      icon: <FileText className="w-10 h-10 text-primary" />,
      title: "ملفات شخصية متكاملة",
      description:
        "استعرض ملفات الأكاديميين التي تعرض خبراتهم، أعمالهم السابقة، وتقييمات موثوقة من طلاب وعملاء.",
    },
    {
      icon: <MessageCircle className="w-10 h-10 text-primary" />,
      title: "تواصل مسبق وشفاف",
      description:
        "تفاعل مباشرة مع الأكاديميين عبر المحادثات للتفاوض وتوضيح تفاصيل العمل قبل البدء.",
    },
    {
      icon: <Wallet className="w-10 h-10 text-primary" />,
      title: "حماية مالية مضمونة",
      description:
        "تبقى قيمة المشروع في رصيدك حتى تستلم العمل كاملاً بالجودة المتفق عليها.",
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
      title: "ضمان كامل للحقوق",
      description:
        "في حال عدم استلام العمل كما هو متفق عليه، تسترد كامل المبلغ المدفوع.",
    },
    {
      icon: <Headphones className="w-10 h-10 text-primary" />,
      title: "دعم فني متواصل",
      description:
        "فريقنا متاح لمساعدتك على مدار الساعة في جميع مراحل تنفيذ العمل.",
    },
  ];

  return (
    <section className="py-16">
      {/* Section Title */}
      <h2 className="text-3xl md:text-4xl font-bold mb-12">
        كيف نضمن حقوقك وجودة أعمالك
      </h2>

      {/* Grid Items */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-start text-right hover:shadow-lg transition-shadow"
          >
            <div className="mb-4">{item.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <CategoriesSection />
      <GuaranteeSection />
    </>
  );
}
