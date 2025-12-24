import ClipLoader from "react-spinners/ClipLoader";


export default function Loader() {
    return (
            <ClipLoader
                color="#2F92EC"   
                size={60}          
                speedMultiplier={1.5} 
                aria-label="Loading"
            />
    );
}