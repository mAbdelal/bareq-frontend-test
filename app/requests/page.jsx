"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import RequestCard from "@/components/ui/RequestCard";
import PageTitle from "@/components/ui/page-title";
import Slider from "@mui/material/Slider";
import Pagination from "@mui/material/Pagination";
import dynamic from "next/dynamic";


const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });
export default function RequestsPage() {
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [budgetRange, setBudgetRange] = useState([0, 1000]);
    const [deliveryDays, setDeliveryDays] = useState([1, 30]); // min-max
    const [requests, setRequests] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const LIMIT = 10;

    useEffect(() => {
        fetchCategories();
        fetchRequests(1, false);
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/academic-categories/public`);
            const json = await res.json();
            setCategories(json.data);
        } catch (err) {
            console.error("Error loading categories", err);
        }
    };

    const fetchRequests = async (page = 1, withFilters = true) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (withFilters) {
                if (selectedCategories.length > 0) {
                    params.append("academic_category_id", selectedCategories[0]);
                }

                if (selectedSkills.length > 0) {
                    const skillsCSV = selectedSkills.map(s => s.label).join(",");
                    params.append("skills", skillsCSV);
                }

                if (budgetRange) {
                    params.append("min_budget", budgetRange[0]);
                    params.append("max_budget", budgetRange[1]);
                }

                if (deliveryDays) {
                    params.append("min_delivery_days", deliveryDays[0]);
                    params.append("max_delivery_days", deliveryDays[1]);
                }
            }

            params.append("page", page);
            params.append("limit", LIMIT);

            const url = `${process.env.NEXT_PUBLIC_BASE_URL}/requests/search/public?${params.toString()}`;
            const res = await fetch(url,{
                cache: "no-store",
            });
            const json = await res.json();

            setRequests(json.data.data);
            setTotalPages(Math.ceil(json.total / LIMIT));
            setCurrentPage(json.page);
        } catch (err) {
            console.error("Error fetching requests", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => fetchRequests(1, true);
    const handlePageChange = (event, page) => fetchRequests(page, true);

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
            <PageTitle title="الطلبات" paragraph="ابحث عن طلبات أكاديمية لتنفيذها" />

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

                    {/* Budget */}
                    <div>
                        <h3 className="font-semibold mb-2">الميزانية</h3>
                        <Slider
                            value={budgetRange}
                            onChange={(e, newValue) => setBudgetRange(newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={1000}
                            step={10}
                        />
                        <div className="mt-1 text-sm">
                            من {budgetRange[0]}$ إلى {budgetRange[1]}$
                        </div>
                    </div>

                    {/* Delivery Days Range */}
                    <div>
                        <h3 className="font-semibold mb-2">مدة التسليم (أيام)</h3>
                        <Slider
                            value={deliveryDays}
                            onChange={(e, newValue) => setDeliveryDays(newValue)}
                            valueLabelDisplay="auto"
                            min={1}
                            max={30}
                            step={1}
                        />
                        <div className="mt-1 text-sm">
                            من {deliveryDays[0]} إلى {deliveryDays[1]} يوم
                        </div>
                    </div>

                    <Button className="mt-4 w-full bg-primary text-xl" onClick={handleSearch}>
                        بحث
                    </Button>
                </div>

                {/* Requests Section */}
                <div className="w-full md:w-3/4 flex flex-col gap-6">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(LIMIT)].map((_, idx) => (
                                <div key={idx} className="h-72 bg-gray-200 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center text-gray-500 text-lg mt-20">
                            لا توجد طلبات لعرضها
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.map(request => (
                                <RequestCard key={request.id} request={request} />
                            ))}
                        </div>
                    )}

                    {requests.length > 0 && (
                        <div className="mt-4 flex justify-center">
                            <Pagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}