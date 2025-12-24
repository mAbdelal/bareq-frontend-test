"use client";
import dynamic from "next/dynamic";

// Import AsyncSelect dynamically (avoids SSR issues)
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export default function MyComponent({
    loadSkillSuggestions,
    selectedSkills,
    setSelectedSkills,
}) {
    return (
        <AsyncSelect
            instanceId="skills-async-select"
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadSkillSuggestions}
            onChange={(selected) => setSelectedSkills(selected || [])}
            value={selectedSkills}
            placeholder="اكتب لاختيار المهارات"
            className="text-right"
            classNamePrefix="select"
            noOptionsMessage={() => "لا يوجد نتائج"}
            closeMenuOnSelect={false}
        />
    );
}
