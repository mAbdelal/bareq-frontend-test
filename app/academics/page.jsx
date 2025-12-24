"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AcademicCard from "@/components/ui/AcademicCard";
import AsyncSelect from "react-select/async";
import PageTitle from "@/components/ui/page-title";
import Slider from "@mui/material/Slider";
import Pagination from "@mui/material/Pagination";
import { useUser } from "@/context/UserContext";

export default function AcademicsPage() {
    const { state } = useUser();
    const loggedInUser = state.user;

    const [selectedJobTitles, setSelectedJobTitles] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [ratingRange, setRatingRange] = useState([0, 5]);
    const [academics, setAcademics] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const LIMIT = 10;

    // Load initial academics
    useEffect(() => {
        fetchAcademics(currentPage);
    }, []);

    const fetchAcademics = async (page = 1) => {
        try {
            const params = new URLSearchParams();
            if (selectedJobTitles.length > 0) {
                params.append("job_titles", selectedJobTitles.map((t) => t.value).join(","));
            }
            if (selectedSkills.length > 0) {
                params.append("skills", selectedSkills.map((s) => s.value).join(","));
            }
            if (ratingRange) {
                params.append("min_rating", ratingRange[0]);
                params.append("max_rating", ratingRange[1]);
            }
            params.append("page", page);
            params.append("limit", LIMIT);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/academic-users/public/search?${params.toString()}`
            );
            const json = await res.json();

            const filteredAcademics = loggedInUser
                ? json.data.users.filter((u) => u.user_id !== loggedInUser.id)
                : json.data.users;

            setAcademics(filteredAcademics);
            setTotalPages(json.data.totalPages);
            setCurrentPage(json.data.page);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = () => {
        fetchAcademics(1); // reset to first page on search
    };

    const handlePageChange = (event, page) => {
        fetchAcademics(page);
    };

    const loadJobTitleSuggestions = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/job-titles/suggestions?query=${encodeURIComponent(inputValue)}`
            );
            const json = await res.json();
            return json.data.map((entity) => ({ value: entity.id, label: entity.title_ar }));
        } catch {
            return [];
        }
    };

    const loadSkillSuggestions = async (inputValue) => {
        if (!inputValue) return [];
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL}/skills/suggestions?query=${encodeURIComponent(inputValue)}`
            );
            const json = await res.json();
            return json.data.map((skill) => ({ value: skill.id, label: skill.name }));
        } catch {
            return [];
        }
    };

    return (
        <div className="pb-10 pt-12 text-label">
            <PageTitle title="الأكاديميون" paragraph="ابحث عن افضل الأكاديميين لانجاز اعمالك" />

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Filters */}
                <div className="h-fit md:w-1/4 flex flex-col gap-6 bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
                    <h2 className="text-3xl text-label font-bold">بحث</h2>

                    <div>
                        <h3 className="font-semibold mb-2">المسمى الوظيفي</h3>
                        <AsyncSelect
                            isMulti
                            cacheOptions
                            defaultOptions
                            loadOptions={loadJobTitleSuggestions}
                            onChange={(selected) => setSelectedJobTitles(selected || [])}
                            value={selectedJobTitles}
                            placeholder="اكتب المسمى الوظيفي"
                            className="text-right"
                            classNamePrefix="select"
                            noOptionsMessage={() => "لا يوجد نتائج"}
                            closeMenuOnSelect={false}
                        />
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">المهارات</h3>
                        <AsyncSelect
                            isMulti
                            cacheOptions
                            defaultOptions
                            loadOptions={loadSkillSuggestions}
                            onChange={(selected) => setSelectedSkills(selected || [])}
                            value={selectedSkills}
                            placeholder="اكتب المهارات"
                            className="text-right"
                            classNamePrefix="select"
                            noOptionsMessage={() => "لا يوجد نتائج"}
                            closeMenuOnSelect={false}
                        />
                    </div>

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

                {/* Results */}
                <div className="w-full md:w-3/4 flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {academics.map((acad) => (
                            <AcademicCard key={acad.user_id} acad={acad} />
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex justify-center">
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
