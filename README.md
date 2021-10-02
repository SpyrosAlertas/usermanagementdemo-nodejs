# usermanagementdemo-nodejs
NodeJS project to demonstrate basic user authentication/authorization with JSON Web Tokens (jwt)

## Keywords
 1. **NodeJS**
 2. **JavaScript**
 3. **Express**
 4. **RESTful API**
 5. **JWT**
 6. **Authentication**
 7. **Authorization**
 8. **MySQL**
 9. **SQL**
10. **Middleware**
11. **CORS**
12. **Pagination**
13. **ORM**
14. **File Upload**

## Brief description
There are 3 roles. Guests can login or register. Newly registered accounts can't login, an admin has to activate their accounts first so they can login. Users can login, view their profiles, edit their profiles or delete their accounts. Users can also upload a profile image or delete it. Admins can do anything guests and users can do. They can also view a list of all users, activate new accounts or remove anyones account. They can also delete profile images from users.
If someone tries to login many times in a short period with wrong password his account get temporarily locked for a short period before user can try to login again.

## RESTful API by User Role

### 1. Guests can:
* Login ->
**post request @** http://localhost:3000/login ({ "username": "username", "password": "password" })
* Register ->
**post request @** http://localhost:3000/users ({ "username": "username", "password": "password", "firstName": "firstName", "lastName": "lastName", "email": "email", "phone": "phone?", "country": "country?", "city": "city?", "address": "address?" })

### 2. Users can (those who have already logged in):
* Logout (well nothing needed to be done here with jwts here)
* View their profile details ->
**get request @** http://localhost:3000/users/:username
* Update their profile details ->
**put request @** http://localhost:3000/users/:username ({ "password": "password?", "firstName": "firstName?", "lastName": "lastName?", "email": "email?", "phone": "phone?", "country": "country?", "city": "city?", "address": "address?" })
* Delete their account ->
**delete request @** http://localhost:3000/users/:username
* Upload a profile image ->
**post request @** http://localhost:3000/users/:username/profileImage (supported image formats are jpg, jpeg and png up to 2MB - { "profileImage": "iamgefile" })
* Get their profile image ->
**get request @** http://localhost:3000/users/:username/profileImage
* Delete their profile image ->
**delete request @** http://localhost:3000/users/:username/profileImage

### 3. Admins, can do anything normal users can do plus:
* View a list of all users ->
**get request @** http://localhost:3000/users?page=0&sort=fieldToBeSortedBy&order=DESC
* Activate normal users accounts ->
**put request @** http://localhost:3000/users/:username/activate
* Delete other users accounts (his too) ->
**delete request @** http://localhost:3000/users/:username
* Delete other users profile images (his too) ->
**delete request @** http://localhost:3000/users/:username/profileImage

## Other info
*fields with ? are optional*  
*seeder/db_seeder.js* is a simple JavaScript file you can execute to seed the database with some random users and an admin account with username and password *admin* for testing.

## Versions used
* MySQL v8.0.26
* NodeJS v14.17.3



