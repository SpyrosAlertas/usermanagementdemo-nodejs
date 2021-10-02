const Sequelize = require('sequelize');

// sequelize user model
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('User', {
        userId: {
            field: 'user_id',
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
            unique: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                is: ['^[a-zA-Z0-9,.&\\-\']{2,50}$']
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isEnabled: {
            field: 'is_enabled',
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        isNonLocked: {
            field: 'is_non_locked',
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['ADMIN', 'USER']]
            }
        },
        firstName: {
            field: 'first_name',
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                is: ['^[a-zA-Zα-ωΑ-Ω.,\\-\' ]{2,50}$']
            }
        },
        lastName: {
            field: 'last_name',
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                is: ['^[a-zA-Zα-ωΑ-Ω.,\\-\' ]{2,50}$']
            }
        },
        email: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        phone: {
            type: DataTypes.STRING,
            validate: {
                is: ['^[+ 0-9]{10,15}$']
            }
        },
        country: {
            type: DataTypes.STRING,
            validate: {
                is: ['^[a-zA-Zα-ωΑ-Ω.,&()\\-\' ]{3,100}$']
            }
        },
        city: {
            type: DataTypes.STRING,
            validate: {
                is: ['^[a-zA-Zα-ωΑ-Ω.,&()\\-\' ]{3,50}$']
            }
        },
        address: {
            type: DataTypes.STRING,
            validate: {
                is: ['^[a-zA-Zα-ωΑ-Ω0-9.,&()\\-\' ]{3,50}$']
            }
        },
        joinDate: {
            field: 'join_date',
            type: DataTypes.DATE,
            allowNull: false
        },
        lastLoginDate: {
            field: 'last_login_date',
            type: DataTypes.DATE
        },
        lastLoginAttemptDate: {
            field: 'last_login_attempt_date',
            type: DataTypes.DATE,
            allowNull: false
        },
        failedLoginAttempts: {
            field: 'failed_login_attempts',
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        // default scope returns only password and role as it will be used only for login (authentication/authorization) purposes
        defaultScope: {
            attributes: ['password', 'role']
        },
        scopes: {
            // we need the primary key (user_id) and password for login
            pk: {
                attributes: ['userId', 'password']
            },
            // brief description is used when someone get a list of many users and sees only basic info of each user
            brief: {
                attributes: ['username', 'isEnabled', 'isNonLocked', 'role', 'joinDate']
            },
            // detailed description is used when someone views a users profile and wants to see all information (we only hide sensitive fields)
            detailed: {
                attributes: ['username', 'isEnabled', 'isNonLocked', 'role', 'firstName', 'lastName',
                    'email', 'phone', 'country', 'city', 'address', 'joinDate', 'lastLoginDate', 'lastLoginAttemptDate']
            },
            loginAttempts: {
                attributes: ['lastLoginAttemptDate', 'failedLoginAttempts']
            }
        },
        tableName: 'user',
        timestamps: false
    })
};