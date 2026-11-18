import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TestAPI from "./components/TestAPI";
import ImportCourses from "./components/ImportCourses";
import "./App.css";
import {Routes, Route} from "react-router-dom";

function App (){
  return (
    <div className ="app-container">
      <Sidebar/>
      <Routes>
        <Route path ="/" element={<Dashboard/>} />
        <Route path ="/importer" element={<ImportCourses />}/>
        <Route path="/test" element={<TestAPI />} />
      </Routes>
    </div>
  )
}
export default App ; 