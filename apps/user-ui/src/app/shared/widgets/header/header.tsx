"use client";
import Link from "next/link";
import React from "react";
import { HeartIcon, Search, ShoppingBasket, UserRound } from "lucide-react";
import HeaderBottom from "./header-bottom";
import useUser from "apps/user-ui/src/hooks/useUser";
import ProfileIcon from "apps/user-ui/src/assets/svgs/profile-icon";

const Header = () => {
    const { user, isLoading } = useUser();

    return (
        <div className="w-full bg-white">
            <div className="w-[80%] py-5 m-auto flex items-center justify-between">
                <div>
                    <Link href={"/"}>
                        <span className="text-3xl font-[500]">
                            Subkuch.store
                        </span>
                    </Link>
                </div>
                <div className="w-[50%] relative">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        className="w-full px-4 font-Poppins font-medium border-[2.5px] border-[#3489FF] outline-none h-[55px]"
                    />
                    <div className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-[#3489FF] absolute top-0 right-0">
                        <Search color="#fff" />
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        {!isLoading && user ? (
                            <>
                                <Link
                                    href={"/profile"}
                                    className="border-2 w-[50px] h-[50px] flex items-center justify-center rounded-full border-[#010f1c1a] hover:border-[#3489FF] hover:bg-[#3489FF]/5 transition-all duration-200"
                                >
                                    <ProfileIcon />
                                </Link>
                                <Link
                                    href={"/profile"}
                                    className="hover:text-[#3489FF] transition-colors duration-200"
                                >
                                    <span className="block font-medium text-sm">
                                        Hello,{" "}
                                    </span>
                                    <span className="font-semibold text-base">
                                        {user?.name?.split?.(" ")[0] ?? ""}
                                    </span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href={"/login"}
                                    className="border-2 w-[44px] h-[44px] flex items-center justify-center rounded-full border-[#010f1c1a] hover:border-[#3489FF] hover:bg-[#3489FF]/5 transition-all duration-200"
                                >
                                    <UserRound width={28} height={28} />
                                    {/* <ProfileIcon
                                width={28}
                                height={28}
                                color="#010f1c"
                            /> */}
                                </Link>
                                <Link
                                    href={"/login"}
                                    className="hover:text-[#3489FF] transition-colors duration-200"
                                >
                                    <span className="block font-medium text-sm">
                                        Hello,{" "}
                                    </span>
                                    <span className="font-semibold text-base">
                                        {isLoading ? "..." : "Sign In"}
                                    </span>
                                </Link>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-5">
                        <Link href={"/wishlist"} className="relative">
                            <HeartIcon width={25} height={25} />
                            <div className="w-6 h-6 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                                <span className="text-white font-medium text-xs">
                                    4
                                </span>
                            </div>
                        </Link>
                        <Link href={"/cart"} className="relative">
                            <ShoppingBasket width={28} height={28} />
                            <div className="w-6 h-6 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-10px] right-[-10px]">
                                <span className="text-white font-medium text-xs">
                                    2
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="border-b border-b-[#99999938]" />
            <HeaderBottom />
        </div>
    );
};

export default Header;
