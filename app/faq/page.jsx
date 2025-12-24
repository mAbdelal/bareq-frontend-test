
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import BackLink from "@/components/ui/back-link";
import PageTitle from "@/components/ui/page-title";

export default function FAQPage() {
    const faqs = [
        {
            question: "ما هي منصة بارق؟",
            answer: "بارق هي منصة تعليمية متخصصة تربط بين الأكاديميين والطلاب، حيث تقدم خدمات أكاديمية متنوعة وتسهل عملية التعاون في المجال التعليمي."
        },
        {
            question: "كيف يمكنني الاستفادة من بارق؟",
            answer: "يمكنك الاستفادة من بارق عبر عدة طرق: البحث عن خدمات أكاديمية متخصصة، نشر طلبات للحصول على مساعدة في مشاريعك الدراسية، التواصل مع أكاديميين متخصصين، والاستفادة من المحتوى التعليمي المتوفر على المنصة."
        },
        {
            question: "كيف تضمن منصة بارق حقوقي؟",
            answer: "تضمن منصة بارق حقوقك من خلال: نظام دفع آمن، توثيق هوية المستخدمين، سياسات واضحة لحل النزاعات، وحماية المعلومات الشخصية والملكية الفكرية."
        },
        {
            question: "ما هي المجالات التي يمكنني توظيف مستقلين فيها على بارق؟",
            answer: "يمكنك توظيف مستقلين في مجالات متعددة مثل: المساعدة في البحوث الأكاديمية، التدريس الخصوصي، مراجعة وتدقيق الأوراق البحثية، المساعدة في المشاريع الدراسية، والاستشارات الأكاديمية المتخصصة."
        },
        {
            question: "لماذا التوظيف عبر بارق هو الأفضل بالنسبة لي؟",
            answer: "التوظيف عبر بارق هو الأفضل لأنه يوفر: مجتمع متخصص من الأكاديميين المؤهلين، نظام تقييم شفاف، ضمان جودة الخدمات، أسعار تنافسية، ودعم فني متواصل."
        },
        {
            question: "ماذا سيحدث بعد نشر مشروعي على بارق؟",
            answer: "بعد نشر مشروعك على بارق: سيتمكن الأكاديميون المتخصصون من رؤية مشروعك، تلقي عروض وأسعار مختلفة، التواصل مع المهتمين لمناقشة التفاصيل، واختيار العرض المناسب لاحتياجاتك."
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div>
                <BackLink href="/">العودة للرئيسية</BackLink>
            </div>

            <PageTitle title="الأسئلة الشائعة" />
            <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-right text-lg font-bold">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-right text-base">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

            </div>
        </div>
    );
}
