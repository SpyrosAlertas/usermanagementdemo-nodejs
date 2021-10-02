
const faker = require('faker');
const bcrypt = require('bcryptjs');

const { User } = require('../config/database');

// username is always first name but only lowercase letters
// password is always the same as the username

// we create a user with username admin and password admin - beyond the random ones

// how many users to create
const numberOfUsers = 100; // + 1 admins we always create seperately

// always creates a few less entries because of validation/constraint errors

const chanceToBeActive = 0.6;
const chanceToHaveLocationDetails = 0.8;
const changeToHavePhone = 0.8;
const chanceToBeAdmin = 0.1;

async function userGenerator() {
    const users = [];
    for (i = 0; i < numberOfUsers; i++) {
        const lastName = faker.name.lastName();
        const firstName = faker.name.firstName();
        const haveLocationDetails = chanceToHaveLocationDetails > Math.random();
        const user = {
            username: lastName.toLowerCase(),
            password: await bcrypt.hash(lastName.toLowerCase(), 10),
            isEnabled: chanceToBeActive > Math.random(),
            isNonLocked: true,
            role: chanceToBeAdmin > Math.random() ? 'ADMIN' : 'USER',
            firstName: firstName,
            lastName: lastName,
            email: faker.internet.email(firstName, lastName),
            phone: changeToHavePhone > Math.random() ? faker.datatype.number({ 'min': 6900000000, 'max': 6999999999 }) : null,
            country: haveLocationDetails ? faker.address.country() : null,
            city: haveLocationDetails ? faker.address.city() : null,
            address: haveLocationDetails ? faker.address.streetAddress() : null,
            joinDate: new Date(),
            lastLoginAttemptDate: new Date(),
            failedLoginAttempts: 0
        }
        users.push(user);
    }
    let user = {
        username: 'admin',
        password: await bcrypt.hash('admin', 10),
        isEnabled: true,
        isNonLocked: true,
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'Admin',
        email: 'admin@examplemail.com',
        phone: null,
        country: 'Greece',
        city: 'Athens',
        address: null,
        joinDate: new Date(),
        lastLoginAttemptDate: new Date(),
        failedLoginAttempts: 0
    }
    users.push(user);
    return users;
}

// save generated users in gatabase
userGenerator().then(users => {
    User.bulkCreate(users, { ignoreDuplicates: true });
});