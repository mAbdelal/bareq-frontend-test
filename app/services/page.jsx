'use client'
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import ServiceCard from "@/components/ui/ServiceCard";
import PageTitle from "@/components/ui/page-title";
import Slider from "@mui/material/Slider";
import Pagination from "@mui/material/Pagination";
import dynamicImport from "next/dynamic";
import { toast } from "sonner";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

const AsyncSelect = dynamicImport(() => import("react-select/async"), { ssr: false });

function ServicesPageContent() {
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [ratingRange, setRatingRange] = useState([0, 5]);
    const [services, setServices] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);


    const LIMIT = 9;
    const searchParams = useSearchParams();
    const keyword = searchParams?.get('keyword') || '';

    // Load categories once
    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch services initially and whenever the keyword changes
    useEffect(() => {
        fetchServices(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyword]);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-categories/public`);
            const json = await res.json();
            setCategories(json.data);
        } catch (err) {
            console.error("Error loading categories", err);
        }
    };

    const fetchServices = async (page = 1, withFilters = true) => {
        try {
            setLoading(true);
            let url = `${process.env.NEXT_PUBLIC_BASE_URL}/services/search/public`;
            const params = new URLSearchParams();

            if (withFilters) {
                // include search keyword if present in URL
                if (keyword) {
                    params.append('keyword', keyword);
                }
                if (selectedCategories.length > 0) {
                    params.append("categoryId", selectedCategories[0]);
                }

                if (selectedSkills.length > 0) {
                    const skillsCSV = selectedSkills.map(s => s.label).join(",");
                    params.append("skills", skillsCSV);
                }

                if (priceRange) {
                    params.append("minPrice", priceRange[0]);
                    params.append("maxPrice", priceRange[1]);
                }

                if (ratingRange) {
                    params.append("minRating", ratingRange[0]);
                    params.append("maxRating", ratingRange[1]);
                }
            }

            params.append("page", page);
            params.append("limit", LIMIT);

            url += `?${params.toString()}`;

            const res = await fetch(url);
            const json = await res.json();

            setServices(json.data.data);
            setTotalPages(json.totalPages);
            setCurrentPage(json.page);
        } catch (err) {
            toast.error("فشل تحميل الخدمات");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => fetchServices(1, true);
    const handlePageChange = (event, page) => fetchServices(page, true);

    const loadSkillSuggestions = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/skills/suggestions?query=${encodeURIComponent(inputValue)}`
            );
            const json = await res.json();
            return json.data.map(skill => ({ value: skill.id, label: skill.name }));
        } catch {
            return [];
        }
    };

    const toggleCategory = (id) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    return (
        <div className="pb-10 pt-12 text-label">
            <PageTitle title="الخدمات" paragraph="ابحث عن خدمات أكاديمية مميزة" />

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Filters */}
                <div className="h-fit md:w-1/4 flex flex-col gap-6 bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
                    <h2 className="text-3xl text-label font-bold">بحث</h2>

                    {/* Categories */}
                    <div>
                        <h3 className="font-semibold mb-2">التصنيفات الرئيسية</h3>
                        <div className="flex flex-col gap-2">
                            {categories.map(cat => (
                                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat.id)}
                                        onChange={() => toggleCategory(cat.id)}
                                        className="w-4 h-4"
                                    />
                                    <span>{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <h3 className="font-semibold mb-2">المهارات</h3>
                        <AsyncSelect
                            instanceId="skills-async-select"
                            isMulti
                            cacheOptions
                            defaultOptions
                            loadOptions={loadSkillSuggestions}
                            onChange={selected => setSelectedSkills(selected || [])}
                            value={selectedSkills}
                            placeholder="اكتب لاختيار المهارات"
                            className="text-right"
                            classNamePrefix="select"
                            noOptionsMessage={() => "لا يوجد نتائج"}
                            closeMenuOnSelect={false}
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <h3 className="font-semibold mb-2">السعر</h3>
                        <Slider
                            value={priceRange}
                            onChange={(e, newValue) => setPriceRange(newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={1000}
                            step={10}
                        />
                        <div className="mt-1 text-sm">
                            من {priceRange[0]}$ إلى {priceRange[1]}$
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <h3 className="font-semibold mb-2">التقييم</h3>
                        <Slider
                            value={ratingRange}
                            onChange={(e, newValue) => setRatingRange(newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={5}
                            step={0.1}
                        />
                        <div className="mt-1 text-sm">
                            من {ratingRange[0].toFixed(1)} إلى {ratingRange[1].toFixed(1)}
                        </div>
                    </div>

                    <Button className="mt-4 w-full bg-primary text-xl" onClick={handleSearch}>
                        بحث
                    </Button>
                </div>

                {/* Services Section */}
                <div className="w-full md:w-3/4 flex flex-col gap-6">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(LIMIT)].map((_, idx) => (
                                <div key={idx} className="h-72 bg-gray-200 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center text-gray-500 text-lg mt-20">
                            لا توجد خدمات لعرضها
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map(service => (
                                    <ServiceCard key={service.id} service={service} />
                                ))}
                            </div>

                            <div className="mt-4 flex justify-center">
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ServicesPage() {
    return (
        <Suspense fallback={<div className="pb-10 pt-12 text-label"><PageTitle title="الخدمات" paragraph="ابحث عن خدمات أكاديمية مميزة" /></div>}>
            <ServicesPageContent />
        </Suspense>
    );
}
