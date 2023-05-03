from ..utils import requires_admin
import requests
import re
from ..database import (
    Project,
    Checklist,
    ChecklistItem,
    UserChecklist,
    UserChecklistItem,
    Task,
    PayRequests,
    Payments,
    ProjectUser,
    UserTasks,
    User,
)
from flask.views import MethodView
from flask import g, request
from flask_jwt_extended import (
    jwt_required,
)


class ChecklistAPI(MethodView):
    @jwt_required()
    def post(self, path: str):
        if path == "create_checklist":
            return self.create_checklist()
        elif path == "update_checklist":
            return self.update_checklist()
        elif path == "delete_checklist":
            return self.delete_checklist()
        elif path == "fetch_admin_checklists":
            return self.fetch_admin_checklists()
        elif path == "fetch_user_checklists":
            return self.fetch_user_checklists()
        elif path == "start_checklist":
            return self.start_checklist()
        elif path == "complete_list_item":
            return self.complete_list_item()   

   
        return {
            "message": "Only /project/{fetch_users,fetch_user_projects} is permitted with GET",  # noqa: E501
        }, 405

    @requires_admin
    def create_checklist(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        checklist_name=request.json.get("checklistName")
        checklist_desc=request.json.get("checklistDescription")
        completion_rate = float(request.json.get("completionRate"))
        validation_rate = float(request.json.get("validationRate"))
        visibility = request.json.get("visibility")
        difficulty = request.json.get("checklistDifficulty")
        listItems = request.json.get("listItems")
        due_date = request.json.get("dueDate")
        required_args = [
            "checklistName",
            "checklistDescription",
            "completionRate",
            "validationRate",
            "checklistDifficulty",
            "listItems",
            "dueDate",
        ]
        for arg in required_args:
            if not request.json.get(arg):
                return {"message": f"{arg} required", "status": 400}
        name='%s (%s)'%(g.user.first_name.capitalize(),g.user.osm_username)
        new_checklist=Checklist.create(
            name=checklist_name,
            author=name,
            org_id = g.user.org_id,
            description=checklist_desc,
            completion_rate=completion_rate,
            validation_rate=validation_rate,
            visibility=visibility,
            difficulty=difficulty,
            active_status=False,

            due_date=due_date
        )


        print(listItems)
        for item in listItems:
            print(item['number'])
            ChecklistItem.create(
                checklist_id=new_checklist.id,
                item_number = item['number'],
                item_action = item['action'],
                item_link = item['link'],
                completed = False,
                confirmed = False,
            )



        print(
            checklist_name,
            checklist_desc,
            completion_rate,
            validation_rate,
            visibility,
            difficulty,
            listItems
        )

        response['message']='%s Created'%(checklist_name)
        response['status']=200
        return response
    


    @requires_admin
    def update_checklist(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        checklist_id= request.json.get("checklistSelected")
        checklist_name=request.json.get("checklistName")
        checklist_desc=request.json.get("checklistDescription")
        
        difficulty = request.json.get("difficulty")
        completion_rate = float(request.json.get("completionRate"))
        validation_rate = float(request.json.get("validationRate"))
        visibility = request.json.get("visibility")
        active_status = request.json.get("checklistStatus")
        due_date = request.json.get("dueDate")



        # required_args = ["difficulty", "validation_rate", "mapping_rate", "max_editors", "max_validators","project_id"]
        # for arg in required_args:
        #     if not request.json.get(arg):
        #         return {"message": f"{arg} required", "status": 400}

        if not active_status:
            active_status = False
        else:
            active_status = True

        target_checklist = Checklist.query.filter_by(
            id=int(checklist_id)
        ).first()

        if not target_checklist:
            response["message"] = "Checklist %s not found" % (checklist_id)
            response["status"] = 400
            return response
        
        if checklist_name == "" or checklist_name ==None:
            checklist_name=target_checklist.name
        
        if checklist_desc == "" or checklist_desc ==None:
            checklist_desc=target_checklist.description

        if due_date == "" or due_date ==None:
            due_date=target_checklist.due_date



        target_checklist.update(
            name=checklist_name,
            description=checklist_desc,
            visibility=visibility,
            difficulty=difficulty, 
            active_status=active_status,
            completion_rate =completion_rate,
            validation_rate =validation_rate,
            due_date=due_date

        )

        # Put logic here to process remaining payouts or whatever else before deletion  # noqa: E501
        response['message']='Checklist Updated'
        response["status"] = 200
        return response

    @requires_admin
    def delete_checklist(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        project_id = request.json.get("project_id")
        if not project_id:
            return {"message": "project_id required", "status": 400}
        target_project = Project.query.filter_by(
            org_id=g.user.org_id, id=project_id
        ).first()
        if not target_project:
            response["message"] = "Project %s not found" % (project_id)
            response["status"] = 400
            return response
        else:
            # Put logic here to process remaining payouts or whatever else before deletion  # noqa: E501
            target_project.delete(soft=False)
            response["message"] = "Project %s deleted" % (project_id)
            response["status"] = 200
            return response

    # @requires_admin
    def fetch_admin_checklists(self):
        response = {}
        active_checklists=[]
        inactive_checklists=[]
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response        
        # Get all projects for the organization
        org_id = g.user.org_id
        org_checklists = Checklist.query.filter_by(
            org_id=org_id
        ).all()
        for checklist in org_checklists:
            due_date=str(checklist.due_date).split(' 00:00:00 GMT')[0]
            due_date=str(due_date).split('00:00:00')[0]
            print(due_date)
            checklist_obj= {
                'id':checklist.id,
                'name':checklist.name, 
                'author':checklist.author, 
                'description' :checklist.description,
                'due_date' :due_date,
                'total_payout' :checklist.total_payout,
                'validation_rate' :checklist.validation_rate,
                'completion_rate':checklist.completion_rate,
                'difficulty' :checklist.difficulty,
                'visibility':checklist.visibility,
                'active_status':checklist.active_status,
                'completed' :checklist.completed,
                'confirmed'  :checklist.confirmed,     
                'list_items':[]             
                }
            print(checklist.id)
            checklist_items=ChecklistItem.query.filter_by(checklist_id = checklist.id).all()
            print(checklist_items)
            for item in checklist_items:
                print(item.item_number)
                item_obj={
                    'number':item.item_number,
                    'action':item.item_action,
                    'link':item.item_link,
                }
                checklist_obj['list_items'].append(item_obj)
            if checklist_obj['active_status']==True:
                active_checklists.append(
                    checklist_obj
                )
            else:
                inactive_checklists.append(
                    checklist_obj
                )

        return {
            "active_checklists": active_checklists,
            "inactive_checklists": inactive_checklists,
            "status": 200,
        }
    





    def fetch_user_checklists(self):
        response = {}

        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response        
        # Get all projects for the organization
        org_id = g.user.org_id

        org_checklists = Checklist.query.filter_by(
            org_id=org_id, active_status = True
        ).all()

        user_checklists=UserChecklist.query.filter_by(user_id=g.user.id).all()
        print(len(user_checklists))
        user_checklist_ids=[checklist.checklist_id for checklist in user_checklists]
        user_confirmed_checklists=[]
        user_completed_checklists=[]
        user_started_checklists=[]
        user_available_checklists=[]

        user_new_checklists=[checklist for checklist in org_checklists if checklist.id not in user_checklist_ids]
        print(user_new_checklists)
        for list in user_checklists,user_new_checklists:
            for checklist in list:
                due_date=str(checklist.due_date).split(' 00:00:00 GMT')[0]
                due_date=str(due_date).split('00:00:00')[0]
                checklist_obj= {
                    'id':checklist.id,
                    'name':checklist.name, 
                    'author':checklist.author, 
                    'description' :checklist.description,
                    'due_date' :due_date,

                    'total_payout' :checklist.total_payout,
                    'validation_rate' :checklist.validation_rate,
                    'completion_rate':checklist.completion_rate,
                    'difficulty' :checklist.difficulty,
                    'visibility':checklist.visibility,
                    'active_status':checklist.active_status,
                    'completed' :checklist.completed,
                    'confirmed'  :checklist.confirmed,     
                    'list_items':[]             
                    }
                #                    'payment_due':checklist.payment_due,

                if checklist in user_checklists:
                    checklist_items=UserChecklistItem.query.filter_by(checklist_id = checklist.id, user_id=g.user.id).all()
                    print("YO",checklist_items)
                    for item in checklist_items:
                        item_obj={
                        'number':item.item_number,
                        'action':item.item_action,
                        'link':item.item_link,
                        'completed':item.completed,
                        'confirmed':item.confirmed
                    }
                        checklist_obj['list_items'].append(item_obj)
                    print('list_items',checklist_obj['list_items'])
                else:
                    checklist_items=ChecklistItem.query.filter_by(checklist_id = checklist.id).all()        
                    for item in checklist_items:
                        item_obj={
                            'number':item.item_number,
                            'action':item.item_action,
                            'link':item.item_link,
                        }
                        checklist_obj['list_items'].append(item_obj)

                if checklist.completed!=True and checklist.confirmed != True and  checklist not in user_new_checklists:
                    user_started_checklists.append(
                        checklist_obj
                    )
                if checklist.completed==True and checklist.confirmed != True and  checklist not in user_new_checklists:
                    user_completed_checklists.append(
                        checklist_obj
                    )
                if checklist.completed==True and checklist.confirmed == True and  checklist not in user_new_checklists:
                    user_confirmed_checklists.append(
                        checklist_obj
                    )
                elif checklist in user_new_checklists and checklist.completed!=True and checklist.confirmed != True:

                    user_available_checklists.append(
                        checklist_obj
                    )
        print("LIST",user_started_checklists)
        print("LIST",user_available_checklists)
        return {
            "user_started_checklists": user_started_checklists,
            "user_completed_checklists": user_completed_checklists,
            "user_confirmed_checklists": user_confirmed_checklists,
            "user_available_checklists": user_available_checklists,
            "status": 200,
        }
    





    def start_checklist(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        checklist_id=request.json.get("checklist_id")
        required_args = [
            "checklist_id",
        ]
        for arg in required_args:
            if not request.json.get(arg):
                return {"message": f"{arg} required", "status": 400}
        target_checklist=Checklist.query.filter_by(id=checklist_id).first()
        target_checklist_items=ChecklistItem.query.filter_by(checklist_id=checklist_id).all()
        new_user_checklist=UserChecklist.create(
            checklist_id=checklist_id,
            user_id=g.user.id,
            completed = False,
            confirmed = False,
            name=target_checklist.name,
            author=target_checklist.author,
            org_id = g.user.org_id,
            description=target_checklist.description,
            completion_rate=target_checklist.completion_rate,
            validation_rate=target_checklist.validation_rate,
            visibility=target_checklist.visibility,
            difficulty=target_checklist.difficulty,
            active_status=False,
            due_date=target_checklist.due_date
        )
        for checklist_item in target_checklist_items:
            UserChecklistItem.create(
                checklist_id=new_user_checklist.id,
                user_id=g.user.id,
                item_number = checklist_item.item_number,
                item_action =checklist_item.item_action,
                item_link= checklist_item.item_link,
                completed=False,
                confirmed =False
            )



        response['message']="Checklist Started"
        response['status']=200
        return response
    
    def complete_list_item(self):
        response = {}
        # Check if user is authenticated
        if not g:
            response["message"] = "User not found"
            response["status"] = 304
            return response
        # Check if required data is provided
        checklist_id=request.json.get("checklist_id")
        item_number=request.json.get("item_number")
                
        required_args = [
            "checklist_id",
            "item_number"
        ]
        for arg in required_args:
            if not request.json.get(arg):
                return {"message": f"{arg} required", "status": 400}
        target_user_checklist_item=UserChecklistItem.query.filter_by(
            user_id=g.user.id,
            checklist_id=checklist_id,
            item_number=item_number
        ).first()
        target_user_checklist=UserChecklist.query.filter_by(
                user_id=g.user.id,
                id=checklist_id,
            ).first()
        target_user_checklist_item.update(
            completed=True
        )
        all_user_checklist_items_completion=[item.completed for item in UserChecklistItem.query.filter_by(
            user_id=g.user.id,
            checklist_id=checklist_id,
        ).all()]
        print(checklist_id)
        if not False in all_user_checklist_items_completion:
            target_user_checklist.update(
                completed=True
            )
    
        response['status']=200
        return response