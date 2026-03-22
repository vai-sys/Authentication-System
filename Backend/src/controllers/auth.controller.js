



const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const sessionModel = require("../models/session.model");
const {sendEmail} =require("../service/email.service")
const {generateOTP,getOtpHtml}=require("../utils/utils")
const otpModel=require("../models/otp.model")

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

 
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    
    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email already exists"
      });
    }

 
    const hashedPassword = await bcrypt.hash(password, 10);

   
    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      verified: false
    });

    //   const refreshToken = jwt.sign(
        //     { id: newUser._id },
        //     config.REFRESH_TOKEN_SECRET,
        //     { expiresIn: "15d" }
        // );

        // const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

       
        // const session = await sessionModel.create({
        //     user: newUser._id,
        //     refreshToken: refreshTokenHash,
        //     ip: req.ip,
        //     userAgent: req.headers["user-agent"]
        // });

       
        // const accessToken = jwt.sign(
        //     {
        //         id: newUser._id,
        //         sessionId: session._id
        //     },
        //     config.JWT_SECRET,
        //     { expiresIn: "15m" }
        // );

        // res.cookie("refreshToken", refreshToken, {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: "strict",
        //     maxAge: 15 * 24 * 60 * 60 * 1000
        // });
    
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

 
    await otpModel.create({
      email,
      user: newUser._id,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

   
    const html = getOtpHtml(otp);
    await sendEmail(
      email,
      "Verify your email",
      `Your OTP is ${otp}`,
      html
    );

    return res.status(201).json({
      message: "User registered. Please verify OTP sent to email.",
      user: {
        username: newUser.username,
        email: newUser.email,
        verified: newUser.verified
      }
    });

  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}



async function login(req, res) {
    try {
        const { email, password } = req.body;

       
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }
 
    
        const user = await userModel.findOne({ email });



        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        
        if(!user.verified){
            return res.status(401).json({
                message:"OTP not verified"
            })
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

       
        const refreshToken = jwt.sign(
            { id: user._id },
            config.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

       
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

       
        const session = await sessionModel.create({
            user: user._id,
            refreshToken: refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

       
        const accessToken = jwt.sign(
            {
                id: user._id,
                sessionId: session._id
            },
            config.JWT_SECRET,
            { expiresIn: "15m" }
        );

      
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, 
            sameSite: "strict",
            maxAge: 15 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            accessToken
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


async function getMe(req, res) {
    try {
        const user = await userModel
            .findById(req.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({ user });

    } catch (err) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}




async function refreshToken(req, res) {
    try {
        const tokenFromCookie = req.cookies?.refreshToken;

        if (!tokenFromCookie) {
            return res.status(401).json({
                message: "Refresh token not found"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(
                tokenFromCookie,
                config.REFRESH_TOKEN_SECRET
            );
        } catch (err) {
            return res.status(403).json({
                message: "Invalid or expired refresh token"
            });
        }

        const sessions = await sessionModel.find({
            user: decoded.id,
            revoked: false
        });

        let validSession = null;

        for (const session of sessions) {
            const isMatch = await bcrypt.compare(
                tokenFromCookie,
                session.refreshToken
            );

            if (isMatch) {
                validSession = session;
                break;
            }
        }

        if (!validSession) {
            return res.status(403).json({
                message: "Invalid refresh token"
            });
        }

        
        const newRefreshToken = jwt.sign(
            { id: decoded.id },
            config.REFRESH_TOKEN_SECRET,
            { expiresIn: "15d" }
        );

        const newHash = await bcrypt.hash(newRefreshToken, 10);

        validSession.refreshToken = newHash;
        await validSession.save();

       
        const newAccessToken = jwt.sign(
            {
                id: decoded.id,
                sessionId: validSession._id
            },
            config.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 15 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function logout(req, res) {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token not found"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(
                refreshToken,
                config.REFRESH_TOKEN_SECRET
            );
        } catch (err) {
            return res.status(403).json({
                message: "Invalid or expired refresh token"
            });
        }

     
        const sessions = await sessionModel.find({
            user: decoded.id,
            revoked: false
        });

        let targetSession = null;

       
        for (const session of sessions) {
            const isMatch = await bcrypt.compare(
                refreshToken,
                session.refreshToken
            );

            if (isMatch) {
                targetSession = session;
                break;
            }
        }

        if (!targetSession) {
            return res.status(403).json({
                message: "Session not found or already logged out"
            });
        }

       
        targetSession.revoked = true;
        await targetSession.save();

       
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        });

        return res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function logoutAll(req, res) {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token not found"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(
                refreshToken,
                config.REFRESH_TOKEN_SECRET
            );
        } catch (err) {
            return res.status(403).json({
                message: "Invalid or expired refresh token"
            });
        }

       
        await sessionModel.updateMany(
            { user: decoded.id, revoked: false },
            { $set: { revoked: true } }
        );

        
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        });

        return res.status(200).json({
            message: "Logged out from all devices successfully"
        });

    } catch (error) {
        console.error("Logout all devices error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function verifyEmail(req, res) {
  try {
    const { otp, email } = req.body;

   
    if (!otp || !email) {
      return res.status(400).json({
        message: "OTP and email are required"
      });
    }

    const otpDoc = await otpModel
      .findOne({ email })
      .sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({
        message: "Invalid or expired OTP"
      });
    }

   
    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

   
    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

   
    const user = await userModel.findByIdAndUpdate(
      otpDoc.user,
      { verified: true },
      { new: true }
    );

    await otpModel.deleteMany({ email });

    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        email: user.email,
        verified: user.verified
      }
    });

  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}
module.exports = {
    register,
    getMe,
    refreshToken ,
    logout ,
    login,
    logoutAll,
    verifyEmail
};
