import React from "react";
import { Card, PageHead } from "../../../components/common/PagePrimitives";
export default function AdminUsersPage(){
  return <><PageHead eyebrow="MANAGEMENT" title="Users & Roles" desc="Demo screen for user and role management."/>
  <Card><h3>Role management</h3><p>Student, Academic Maintainer, Academic Coordinator, Grievance Officer, Content Editor and Super Admin roles belong here.</p></Card></>;
}
