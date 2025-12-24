export default function PageTitle({ title, paragraph = "", className = "" }) {
    return (
        <div className={`mb-12 text-right ${className}`}>
            <h1 className="text-3xl mb-3 md:text-4xl font-bold">{title}</h1>
            {paragraph && <p className="text-lg">{paragraph}</p>}
        </div>
    )
}

