import {Link} from "react-router-dom";

function  Sidebar() {
    return (
    <aside className = "sidebar">
        <h2 className = "sidebar-logo">MedStudy AI</h2>
        <nav className = "sidebar-nav">
            <Link to="/"> mon tableau de bord</Link>
            <a href ="#mescours"> mes cours</a>
            <Link to="/importer"> importer mes cours</Link>
            <a href ="#fiches"> fiches de révisions</a>
            <a href ="#quiz"> Quiz / QCM</a>
            <a href ="#assistantIA"> Assistant IA</a>
            <a href ="#statistique"> statistique</a>

        </nav>
    </aside>)
}
export default Sidebar