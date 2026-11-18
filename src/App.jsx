import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import {Routes, Route} from "react-router-dom";
import ImportCourses from "./components/ImportCourses";
import "./App.css";

function App (){
  return (
    <div className ="app-container">
      <Sidebar/>
      <Routes>
        <Route path ="/" element={<Dashboard/>} />
        <Route path ="/importer" element={<ImportCourses />}/>
      </Routes>
    </div>
  )
}
export default App ; 